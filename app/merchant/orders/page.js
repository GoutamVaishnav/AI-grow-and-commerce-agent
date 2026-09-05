"use client";

import { useEffect, useState } from "react";

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    fetch("/api/merchant/orders", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, []);
  if (!orders) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Orders ({orders.length})</h1>
      <p className="text-sm text-gray-500 mb-4">Payments and statuses are stored on the server.</p>
      {!orders.length ? <p className="text-sm text-gray-400">No orders yet.</p> : (
        <div className="bg-white border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="text-left px-4 py-2">Order ID</th><th className="text-left px-4 py-2">Date</th><th className="text-left px-4 py-2">Items</th><th className="text-left px-4 py-2">AI Revenue</th><th className="text-left px-4 py-2">Total</th><th className="text-left px-4 py-2">Status</th></tr></thead>
            <tbody>{orders.map((order) => <tr key={order.orderId} className="border-t"><td className="px-4 py-2 font-medium">{order.orderId}</td><td className="px-4 py-2 text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td className="px-4 py-2">{order.lines.length}</td><td className="px-4 py-2 text-purple-600">{order.aiGeneratedRevenue > 0 ? `₹${order.aiGeneratedRevenue.toLocaleString("en-IN")}` : "—"}</td><td className="px-4 py-2 font-semibold">₹{order.total.toLocaleString("en-IN")}</td><td className="px-4 py-2"><span className={`text-xs font-semibold px-2 py-1 rounded ${order.status === "CONFIRMED" ? "bg-green-100 text-green-700" : order.status === "PAYMENT_PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{order.status}</span></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
