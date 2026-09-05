import Image from "next/image";
import Link from "next/link";

export default function AIProductCard({ product, onAdd }) {
  return (
    <div className="border rounded-md bg-white p-2 w-36 shrink-0 flex flex-col gap-1">
      <Link href={`/products/${product.id}`} className="relative aspect-square bg-gray-50 rounded overflow-hidden block">
        <Image src={product.image} alt={product.name} fill sizes="150px" className="object-cover" />
      </Link>
      <p className="text-xs font-medium line-clamp-2 min-h-[2rem]">{product.name}</p>
      <p className="text-sm font-bold">₹{product.price?.toLocaleString("en-IN")}</p>
      <p className="text-[11px] text-gray-500">{product.rating} ★ · {product.stock > 0 ? "In stock" : "Out of stock"}</p>
      {onAdd && (
        <button
          onClick={() => onAdd(product)}
          disabled={product.stock === 0}
          className="mt-1 text-xs bg-flip-yellow disabled:bg-gray-200 disabled:text-gray-400 text-flip-blue font-semibold py-1 rounded"
        >
          Add to cart
        </button>
      )}
    </div>
  );
}
