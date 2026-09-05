import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

// GET /api/catalog — the clean, machine-readable version of the store's
// catalog. This is what makes the merchant "AI-readable": instead of
// scraping the human HTML storefront, an AI buyer can hit this endpoint
// and get structured product data directly.
export async function GET() {
  const products = getAllProducts().map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice,
    discount: p.discount,
    stock: p.stock,
    rating: p.rating,
    tags: p.tags,
    attributes: p.attributes,
    relatedProducts: p.relatedProducts,
  }));

  return NextResponse.json({
    merchant: {
      name: "ShopAgent Store",
      currency: "INR",
    },
    generatedAt: new Date().toISOString(),
    productCount: products.length,
    products,
  });
}
