import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductById, getRelatedProducts } from "@/lib/products";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGrid from "@/components/ProductGrid";

export default function ProductDetailPage({ params }) {
  const product = getProductById(params.id);
  if (!product) return notFound();
  const related = getRelatedProducts(params.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="bg-white border rounded-md p-6 grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square bg-gray-50 rounded">
          <Image src={product.image} alt={product.name} fill sizes="500px" className="object-cover rounded" />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">{product.brand} · {product.category}</p>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-flip-green text-white px-1.5 py-0.5 rounded font-semibold">{product.rating} ★</span>
            <span className="text-gray-500">{product.reviews} ratings</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">₹{product.price.toLocaleString("en-IN")}</span>
            {product.discount > 0 && (
              <>
                <span className="text-gray-400 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                <span className="text-flip-green font-semibold">{product.discount}% off</span>
              </>
            )}
          </div>

          <p className="text-gray-700">{product.description}</p>

          <div className="text-sm text-gray-600 grid grid-cols-2 gap-y-1 max-w-sm">
            {Object.entries(product.attributes).map(([key, value]) => (
              <div key={key}>
                <span className="capitalize text-gray-400">{key}: </span>
                <span>{Array.isArray(value) ? value.join(", ") : value}</span>
              </div>
            ))}
          </div>

          <p className={`text-sm font-medium ${product.stock === 0 ? "text-red-500" : "text-flip-green"}`}>
            {product.stock === 0 ? "Out of stock" : `In stock — ${product.stock} available`}
          </p>

          <AddToCartButton product={product} />
        </div>
      </div>

      {related.length > 0 && <ProductGrid title="Related Products" products={related} />}
    </div>
  );
}
