import { getProductById } from "@/lib/products";

/**
 * Cart items are stored as [{ productId, quantity, addedBy }].
 * addedBy is "customer" or "ai" — this is what lets us split
 * "organic" revenue from "AI generated" revenue.
 *
 * IMPORTANT: price is never read from the cart item itself. It is
 * always looked up fresh from products.json so a client can never
 * submit a fake price.
 */

export const CART_STORAGE_KEY = "shopagent_cart";

export function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(items, productId, quantity = 1, addedBy = "customer") {
  const id = Number(productId);
  const existing = items.find((i) => i.productId === id);
  if (existing) {
    return items.map((i) => {
      if (i.productId !== id) return i;
      const existingAiQuantity = getAiQuantity(i);
      const nextAiQuantity = existingAiQuantity + (isAiAttributed(addedBy) ? quantity : 0);
      return {
        ...i,
        quantity: i.quantity + quantity,
        aiQuantity: nextAiQuantity,
        addedBy: nextAiQuantity > 0 ? "ai" : "customer",
      };
    });
  }
  return [...items, { productId: id, quantity, addedBy, aiQuantity: isAiAttributed(addedBy) ? quantity : 0 }];
}

export function isAiAttributed(addedBy) {
  return addedBy === "ai" || addedBy === "ai-buyer";
}

export function removeFromCart(items, productId) {
  const id = Number(productId);
  return items.filter((i) => i.productId !== id);
}

export function updateQuantity(items, productId, quantity) {
  const id = Number(productId);
  if (quantity <= 0) return removeFromCart(items, productId);
  return items.map((i) => {
    if (i.productId !== id) return i;
    const aiQuantity = Math.min(getAiQuantity(i), quantity);
    return { ...i, quantity, aiQuantity, addedBy: aiQuantity > 0 ? "ai" : "customer" };
  });
}

/**
 * The single source of truth for cart totals. Used by the cart page,
 * checkout, and the AI agent's calculateCart tool — so a human buyer
 * and an AI buyer always see the exact same numbers.
 */
export function calculateCart(items) {
  const lines = items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      const aiQuantity = Math.min(getAiQuantity(item), item.quantity);
      return {
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        aiQuantity,
        addedBy: aiQuantity > 0 ? "ai" : "customer",
        lineTotal: product.price * item.quantity,
        aiLineTotal: product.price * aiQuantity,
        organicLineTotal: product.price * (item.quantity - aiQuantity),
        inStock: product.stock >= item.quantity,
        stock: product.stock,
      };
    })
    .filter(Boolean);

  const organicTotal = lines
    .reduce((sum, l) => sum + l.organicLineTotal, 0);

  const aiGeneratedRevenue = lines
    .reduce((sum, l) => sum + l.aiLineTotal, 0);

  const subtotal = organicTotal + aiGeneratedRevenue;
  const hasOutOfStock = lines.some((l) => !l.inStock);

  return {
    lines,
    organicTotal,
    aiGeneratedRevenue,
    subtotal,
    total: subtotal,
    hasOutOfStock,
  };
}

function getAiQuantity(item) {
  if (Number.isInteger(item.aiQuantity) && item.aiQuantity >= 0) return item.aiQuantity;
  return isAiAttributed(item.addedBy) ? item.quantity : 0;
}
