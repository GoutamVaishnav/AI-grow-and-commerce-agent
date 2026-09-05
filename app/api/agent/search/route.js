import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";

// POST /api/agent/search
// Body: { query, category, maxPrice, minPrice, tags }
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const results = searchProducts(body);
  return NextResponse.json({ count: results.length, products: results });
}
