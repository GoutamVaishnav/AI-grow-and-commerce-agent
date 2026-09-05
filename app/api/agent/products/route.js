import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

// GET /api/agent/products
// Entry point for an external AI buyer: "here is the whole catalog".
export async function GET() {
  const products = getAllProducts();
  return NextResponse.json({
    merchant: "ShopAgent",
    currency: "INR",
    productCount: products.length,
    products,
  });
}
