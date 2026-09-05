"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readCart, writeCart, addToCart } from "@/lib/cart";

export default function AddToCartButton({ product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function handleAdd() {
    const items = readCart();
    writeCart(addToCart(items, product.id, qty, "customer"));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    const items = readCart();
    writeCart(addToCart(items, product.id, qty, "customer"));
    router.push("/cart");
  }

  const outOfStock = product.stock === 0;

  return (
    <div className="flex flex-col gap-3">
      {!outOfStock && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Qty</span>
          <div className="flex items-center border rounded">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1">-</button>
            <span className="px-3">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-1">+</button>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button
          disabled={outOfStock}
          onClick={handleAdd}
          className="flex-1 bg-flip-yellow disabled:bg-gray-200 disabled:text-gray-400 text-flip-blue font-bold py-3 rounded-sm"
        >
          {added ? "Added ✓" : "🛒 Add to Cart"}
        </button>
        <button
          disabled={outOfStock}
          onClick={handleBuyNow}
          className="flex-1 bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-sm"
        >
          ⚡ Buy Now
        </button>
      </div>
    </div>
  );
}
