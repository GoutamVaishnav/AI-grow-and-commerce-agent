"use client";

import Image from "next/image";
import Link from "next/link";

export default function CartItem({ line, onQuantityChange, onRemove }) {
  return (
    <div className="flex gap-4 border-b py-4 last:border-0">
      <Link href={`/products/${line.productId}`} className="relative w-20 h-20 bg-gray-50 rounded shrink-0">
        <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover rounded" />
      </Link>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex justify-between gap-2">
          <Link href={`/products/${line.productId}`} className="font-medium text-sm hover:text-flip-blue">
            {line.name}
          </Link>
          {line.addedBy === "ai" && (
            <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.5 rounded h-fit">
              ✨ AI recommended
            </span>
          )}
        </div>
        {!line.inStock && (
          <p className="text-xs text-red-500 font-medium">
            No longer available in this quantity (only {line.stock} left)
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center border rounded w-fit">
            <button onClick={() => onQuantityChange(line.productId, line.quantity - 1)} className="px-2 py-0.5">-</button>
            <span className="px-3 text-sm">{line.quantity}</span>
            <button onClick={() => onQuantityChange(line.productId, line.quantity + 1)} className="px-2 py-0.5">+</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">₹{line.lineTotal.toLocaleString("en-IN")}</span>
            <button onClick={() => onRemove(line.productId)} className="text-xs text-red-500 hover:underline">
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
