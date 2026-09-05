import { NextResponse } from "next/server";
import { getSessionCart, setSessionCart } from "@/lib/agentSession";
import { getProductById } from "@/lib/products";
import { addToCart, removeFromCart, calculateCart } from "@/lib/cart";

// POST /api/agent/cart
// Body: { sessionId, action: "add"|"remove"|"get", productId, quantity }
// Prices, stock and totals are always recalculated server-side — the
// client (human or AI) only ever sends a productId + quantity, never a price.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, action = "get", productId, quantity = 1 } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  let cartItems = getSessionCart(sessionId);

  if (action === "add") {
    const product = getProductById(productId);
    if (!product) return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (product.stock < quantity) {
      return NextResponse.json({ error: "Insufficient stock", stock: product.stock }, { status: 409 });
    }
    cartItems = addToCart(cartItems, productId, quantity, "ai-buyer");
  } else if (action === "remove") {
    cartItems = removeFromCart(cartItems, productId);
  }

  setSessionCart(sessionId, cartItems);
  const cart = calculateCart(cartItems);
  return NextResponse.json({ sessionId, cart });
}
