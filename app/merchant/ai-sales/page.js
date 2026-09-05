"use client";

import { useEffect, useState } from "react";
import { computeMetrics } from "@/lib/merchantMetrics";
import { isAiAttributed } from "@/lib/cart";
import RevenueCard from "@/components/RevenueCard";

export default function MerchantAISalesPage() {
  const [rows, setRows] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    async function loadSales() {
      try {
        const response = await fetch("/api/merchant/orders", { cache: "no-store" });
        const { orders = [] } = await response.json();
        setMetrics(computeMetrics(orders));
        const tally = new Map();
        orders.filter((order) => order.status === "CONFIRMED").forEach((order) => {
          order.lines.filter((line) => (line.aiQuantity || 0) > 0 || isAiAttributed(line.addedBy)).forEach((line) => {
            const entry = tally.get(line.productId) || { name: line.name, units: 0, revenue: 0 };
            entry.units += line.aiQuantity || line.quantity;
            entry.revenue += line.aiLineTotal || line.lineTotal;
            tally.set(line.productId, entry);
          });
        });
        setRows([...tally.values()].sort((a, b) => b.revenue - a.revenue));
      } catch {
        setMetrics(computeMetrics([]));
      }
    }
    loadSales();
  }, []);

  if (!metrics) return null;
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">AI Sales</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <RevenueCard label="AI Generated Revenue" value={`₹${metrics.aiGeneratedRevenue.toLocaleString("en-IN")}`} accent="text-purple-600" />
        <RevenueCard label="AI Upsell Orders" value={metrics.aiUpsells} />
        <RevenueCard label="AI Conversion" value={metrics.aiConversion} suffix="%" accent="text-flip-green" />
      </div>
      <div className="bg-white border rounded-md p-4">
        <h2 className="font-semibold mb-1">Products AI Recommends Most</h2>
        <p className="text-xs text-gray-500 mb-3">Only paid, server-confirmed orders contribute to this table.</p>
        {!rows.length ? <p className="text-sm text-gray-400">No AI-driven sales yet — accept an AI recommendation and complete payment.</p> : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase"><tr><th className="text-left py-1">Product</th><th className="text-left py-1">Units Sold via AI</th><th className="text-left py-1">AI Revenue</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.name} className="border-t"><td className="py-2">{row.name}</td><td className="py-2">{row.units}</td><td className="py-2 text-purple-600">₹{row.revenue.toLocaleString("en-IN")}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
