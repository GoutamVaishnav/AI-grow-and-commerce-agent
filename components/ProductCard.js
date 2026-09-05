import Link from "next/link";
import Image from "next/image";

export default function ProductCard({ product }) {
  const outOfStock = product.stock === 0;
  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-white rounded-md border hover:shadow-lg transition-shadow flex flex-col overflow-hidden group"
    >
      <div className="relative bg-gray-50 aspect-square">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="200px"
          className="object-cover group-hover:scale-105 transition-transform"
        />
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-flip-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {product.discount}% OFF
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-bold text-gray-600">
            OUT OF STOCK
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-xs text-gray-500">{product.brand}</p>
        <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{product.name}</p>
        <div className="flex items-center gap-1 text-xs">
          <span className="bg-flip-green text-white px-1 rounded font-semibold">{product.rating} ★</span>
          <span className="text-gray-500">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold">₹{product.price.toLocaleString("en-IN")}</span>
          {product.discount > 0 && (
            <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
