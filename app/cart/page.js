"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCart, writeCart, updateQuantity, removeFromCart, calculateCart } from "@/lib/cart";
import CartItem from "@/components/CartItem";
import ProductGrid from "@/components/ProductGrid";
import { getRelatedProducts } from "@/lib/products";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setMounted(true);
  }, []);

  function persist(next) {
    setItems(next);
    writeCart(next);
  }

  function handleQuantityChange(productId, quantity) {
    persist(updateQuantity(items, productId, quantity));
  }

  function handleRemove(productId) {
    persist(removeFromCart(items, productId));
  }

  if (!mounted) return null;

  const cart = calculateCart(items);
  const outOfStockLines = cart.lines.filter((l) => !l.inStock);
  const alternatives = outOfStockLines.length
    ? outOfStockLines.flatMap((l) => getRelatedProducts(l.productId)).slice(0, 5)
    : [];

  if (!cart.lines.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <Link href="/products" className="text-flip-blue text-sm mt-2 inline-block">
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white border rounded-md p-4">
        <h1 className="font-semibold mb-2">Shopping Cart ({cart.lines.length} items)</h1>
        {cart.lines.map((line) => (
          <CartItem key={line.productId} line={line} onQuantityChange={handleQuantityChange} onRemove={handleRemove} />
        ))}

        {outOfStockLines.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded p-3 text-sm text-red-700">
            <p className="font-medium mb-1">
              {outOfStockLines.map((l) => l.name).join(", ")} {outOfStockLines.length > 1 ? "are" : "is"} no longer
              available in the requested quantity.
            </p>
            <p className="text-red-600/80">Here are similar alternatives within your budget:</p>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-md p-4 h-fit flex flex-col gap-2">
        <h2 className="font-semibold mb-1">Price Details</h2>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Original Cart Value</span>
          <span>₹{cart.organicTotal.toLocaleString("en-IN")}</span>
        </div>
        {cart.aiGeneratedRevenue > 0 && (
          <div className="flex justify-between text-sm text-purple-600">
            <span>✨ AI Added Revenue</span>
            <span>+ ₹{cart.aiGeneratedRevenue.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Final Value</span>
          <span>₹{cart.total.toLocaleString("en-IN")}</span>
        </div>
        <Link
          href={cart.hasOutOfStock ? "#" : "/checkout"}
          aria-disabled={cart.hasOutOfStock}
          className={`mt-3 text-center font-bold py-2.5 rounded-sm ${
            cart.hasOutOfStock
              ? "bg-gray-200 text-gray-400 pointer-events-none"
              : "bg-orange-500 text-white hover:brightness-95"
          }`}
        >
          Proceed to Checkout
        </Link>
      </div>

      {alternatives.length > 0 && (
        <div className="md:col-span-3">
          <ProductGrid title="Similar alternatives" products={alternatives} />
        </div>
      )}
    </div>
  );
}
