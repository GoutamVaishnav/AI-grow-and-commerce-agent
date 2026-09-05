import Link from "next/link";
import CategoryBar from "@/components/CategoryBar";
import ProductGrid from "@/components/ProductGrid";
import { getAllProducts, getCategories } from "@/lib/products";

export default function HomePage() {
  const products = getAllProducts();
  const categories = getCategories();
  const topDeals = [...products].sort((a, b) => b.discount - a.discount).slice(0, 10);
  const recommended = [...products].sort((a, b) => b.rating - a.rating).slice(0, 10);

  return (
    <div>
      <CategoryBar categories={categories} />

      <section className="bg-gradient-to-r from-flip-blue to-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">Shop Smarter with AI</h1>
          <p className="text-white/90 max-w-xl">
            Tell us what you need. Our AI finds the best products for you — searches, compares,
            recommends, and even manages your cart.
          </p>
          <Link
            href="/ai-shopping"
            className="bg-flip-yellow text-flip-blue font-bold px-6 py-2.5 rounded-sm shadow hover:brightness-95"
          >
            Ask AI to Find Products →
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        <ProductGrid title="Top Deals" products={topDeals} />
        <ProductGrid title="Recommended For You" products={recommended} />
      </div>
    </div>
  );
}
