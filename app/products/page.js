import CategoryBar from "@/components/CategoryBar";
import ProductGrid from "@/components/ProductGrid";
import { getCategories, searchProducts } from "@/lib/products";

export default function ProductsPage({ searchParams }) {
  const categories = getCategories();
  const query = searchParams?.q || "";
  const category = searchParams?.category || undefined;
  const maxPrice = searchParams?.maxPrice ? Number(searchParams.maxPrice) : undefined;

  const products = searchProducts({ query, category, maxPrice });

  return (
    <div>
      <CategoryBar categories={categories} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-4">
          {category ? category : query ? `Results for "${query}"` : "All Products"}
          <span className="text-gray-400 font-normal text-sm"> ({products.length} items)</span>
        </h1>
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
