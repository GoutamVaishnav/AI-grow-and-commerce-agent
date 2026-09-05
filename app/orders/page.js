"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersList />
    </Suspense>
  );
}

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");

  useEffect(() => {
    let active = true;
    fetch("/api/orders", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setSignedOut(true);
          return { orders: [] };
        }
        return response.json();
      })
      .then((data) => {
        if (active) setOrders(data.orders || []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setMounted(true);
      });
    return () => { active = false; };
  }, []);

  if (!mounted) return null;

  if (signedOut) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Sign in to view your orders</h1>
        <p className="mt-2 text-sm text-gray-500">Your order history is linked to your ShopAgent account.</p>
        <Link href="/login?next=/orders" className="mt-5 inline-block rounded bg-brand px-4 py-2 text-sm font-semibold text-white">Login</Link>
      </div>
    );
  }

  if (!orders.length) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">You haven't placed any orders yet.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="font-semibold text-lg">Your Orders</h1>
      {orders.map((order) => (
        <div
          key={order.orderId}
          className={`bg-white border rounded-md p-4 ${order.orderId === highlight ? "ring-2 ring-flip-blue" : ""}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{order.orderId}</p>
              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                order.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-1 text-sm">
            {order.lines.map((l) => (
              <div key={l.productId} className="flex justify-between">
                <span>{l.name} × {l.quantity}</span>
                <span>₹{l.lineTotal.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-3 pt-2 flex justify-between text-sm">
            <span className="text-gray-500">
              Organic ₹{order.organicRevenue.toLocaleString("en-IN")}
              {order.aiGeneratedRevenue > 0 && (
                <span className="text-purple-600"> + AI ₹{order.aiGeneratedRevenue.toLocaleString("en-IN")}</span>
              )}
            </span>
            <span className="font-bold">₹{order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
