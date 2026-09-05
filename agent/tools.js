import {
  searchProducts as searchProductsData,
  getProductById,
  getProductsByIds,
  getRelatedProducts as getRelatedProductsData,
  isInStock,
} from "@/lib/products";
import { addToCart as addToCartItems, removeFromCart as removeFromCartItems, calculateCart, isAiAttributed } from "@/lib/cart";
import { buildOrder } from "@/lib/orders";

/**
 * Bounded AI actions (section 22 of the brief). The agent can only ever
 * call one of these — there is no generic "run arbitrary code" tool,
 * and CREATE_PAYMENT is deliberately not in this list: payment is only
 * ever triggered by an explicit customer click in the checkout UI.
 */
export const ALLOWED_ACTIONS = [
  "SEARCH_PRODUCT",
  "VIEW_PRODUCT",
  "COMPARE_PRODUCT",
  "CHECK_STOCK",
  "GET_RELATED_PRODUCTS",
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "GET_CART",
  "CALCULATE_CART",
  "CREATE_ORDER",
];

function ok(action, reason, input, result, revenueImpact = 0) {
  return { action, reason, input, result, revenueImpact, status: "SUCCESS" };
}
function fail(action, reason, input, result) {
  return { action, reason, input, result, revenueImpact: 0, status: "FAILED" };
}

export function searchProducts({ query, category, maxPrice, minPrice, tags, reason }) {
  const results = searchProductsData({ query, category, maxPrice, minPrice, tags });
  const ranked = rankByRelevance(results, { maxPrice, query });
  const recommendedProduct = ranked.find((product) => product.stock > 0) || null;
  const suggestions = recommendedProduct
    ? getRelatedProductsData(recommendedProduct.id).filter((product) => product.stock > 0).slice(0, 2)
    : [];
  return ok(
    "SEARCH_PRODUCT",
    reason || `Searched catalog for "${query || category || "products"}"`,
    { query, category, maxPrice, minPrice, tags },
    {
      count: ranked.length,
      products: ranked.slice(0, 8),
      recommendation: recommendedProduct
        ? {
            id: `REC_${Date.now()}_${recommendedProduct.id}`,
            product: recommendedProduct,
            reason: `Best match: ${recommendedProduct.rating} rating, ₹${recommendedProduct.price}, and currently in stock.`,
          }
        : null,
      suggestions,
    }
  );
}

export function getProductDetails({ productId, reason }) {
  const product = getProductById(productId);
  if (!product) return fail("VIEW_PRODUCT", reason || "Looked up product", { productId }, { error: "Product not found" });
  return ok("VIEW_PRODUCT", reason || `Viewed details for ${product.name}`, { productId }, { product });
}

export function compareProducts({ productIds, reason }) {
  const products = getProductsByIds(productIds);
  if (products.length < 2) {
    return fail("COMPARE_PRODUCT", reason || "Attempted comparison", { productIds }, { error: "Need at least 2 valid products" });
  }
  return ok(
    "COMPARE_PRODUCT",
    reason || `Compared ${products.map((p) => p.name).join(" vs ")}`,
    { productIds },
    { products }
  );
}

export function checkStock({ productId, quantity = 1, reason }) {
  const product = getProductById(productId);
  if (!product) return fail("CHECK_STOCK", reason || "Checked stock", { productId }, { error: "Product not found" });
  const available = isInStock(productId, quantity);
  return ok(
    "CHECK_STOCK",
    reason || `Checked stock for ${product.name}`,
    { productId, quantity },
    { available, stock: product.stock }
  );
}

export function getRelatedProducts({ productId, reason }) {
  const related = getRelatedProductsData(productId);
  return ok(
    "GET_RELATED_PRODUCTS",
    reason || "Looked up related / complementary products",
    { productId },
    { products: related }
  );
}

export function addToCart({ cartItems, productId, quantity = 1, addedBy = "ai", reason }) {
  const product = getProductById(productId);
  if (!product) return { toolResult: fail("ADD_TO_CART", reason, { productId }, { error: "Product not found" }), cartItems };
  if (!isInStock(productId, quantity)) {
    return {
      toolResult: fail("ADD_TO_CART", reason, { productId, quantity }, { error: "Out of stock", stock: product.stock }),
      cartItems,
    };
  }
  const before = calculateCart(cartItems);
  const updated = addToCartItems(cartItems, productId, quantity, addedBy);
  const after = calculateCart(updated);
  const revenueImpact = isAiAttributed(addedBy) ? product.price * quantity : 0;
  const suggestions = getRelatedProductsData(productId)
    .filter((candidate) => candidate.stock > 0)
    .slice(0, 2);

  return {
    toolResult: ok(
      "ADD_TO_CART",
      reason || `Added ${product.name} to cart`,
      { productId, quantity, addedBy },
      { product, cartTotal: after.total, suggestions },
      revenueImpact
    ),
    cartItems: updated,
    before,
    after,
  };
}

export function removeFromCart({ cartItems, productId, reason }) {
  const updated = removeFromCartItems(cartItems, productId);
  return {
    toolResult: ok("REMOVE_FROM_CART", reason || "Removed item from cart", { productId }, { cartItems: updated }),
    cartItems: updated,
  };
}

export function getCart({ cartItems, reason }) {
  const result = calculateCart(cartItems);
  return ok("GET_CART", reason || "Fetched current cart", {}, result);
}

export function calculateCartTool({ cartItems, reason }) {
  const result = calculateCart(cartItems);
  return ok("CALCULATE_CART", reason || "Calculated cart totals", {}, result);
}

export function createOrder({ cartItems, address, paymentMode = "SUCCESS", reason }) {
  const cartResult = calculateCart(cartItems);
  if (!cartResult.lines.length) {
    return fail("CREATE_ORDER", reason || "Attempted to create order", {}, { error: "Cart is empty" });
  }
  if (cartResult.hasOutOfStock) {
    return fail("CREATE_ORDER", reason || "Attempted to create order", {}, {
      error: "Some items are out of stock",
      lines: cartResult.lines,
    });
  }
  const order = buildOrder({ cartResult, address, paymentMode });
  return ok(
    "CREATE_ORDER",
    reason || "Created order pending customer approval",
    { address },
    { order, checkoutUrl: "/checkout", approvalRequired: true },
    cartResult.aiGeneratedRevenue
  );
}

/**
 * Very small ranking heuristic: prefer in-budget, in-stock, higher-rated
 * products. This is deterministic app logic — the LLM never invents
 * a ranking, it only receives this pre-ranked list.
 */
function rankByRelevance(products, { maxPrice, query }) {
  return [...products].sort((a, b) => {
    const aScore = scoreProduct(a, maxPrice, query);
    const bScore = scoreProduct(b, maxPrice, query);
    return bScore - aScore;
  });
}

function scoreProduct(product, maxPrice, query = "") {
  let score = product.rating * 10 + Math.log10(product.reviews + 1);
  const compactQuery = String(query).toLowerCase().replace(/[^a-z0-9]/g, "");
  const compactProduct = `${product.name} ${product.brand}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (compactQuery.length > 2 && compactProduct.includes(compactQuery)) score += 100;
  if (product.stock === 0) score -= 50;
  if (typeof maxPrice === "number") {
    const headroom = maxPrice - product.price;
    if (headroom < 0) score -= 100;
    else score += Math.min(headroom / maxPrice, 1) * 5;
  }
  return score;
}
