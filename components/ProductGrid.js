import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ products, title }) {
  if (!products.length) {
    return <p className="text-gray-500 py-8 text-center">No products found.</p>;
  }
  return (
    <section className="bg-white rounded-md border p-4">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
