"use client";

import { useEffect, useState } from "react";
import { computeMetrics } from "@/lib/merchantMetrics";
import RevenueCard from "@/components/RevenueCard";
import RevenueChart from "@/components/RevenueChart";

export default function MerchantDashboardPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/merchant/orders", { cache: "no-store" });
        const data = await response.json();
        if (active && response.ok) setMetrics(computeMetrics(data.orders || []));
      } catch {
        if (active) setMetrics(computeMetrics([]));
      }
    }
    refresh();
    const interval = window.setInterval(refresh, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!metrics) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">Live revenue from server-confirmed payments. Refreshes automatically.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <RevenueCard label="Total Revenue" value={`₹${metrics.totalRevenue.toLocaleString("en-IN")}`} />
        <RevenueCard label="AI Generated Revenue" value={`₹${metrics.aiGeneratedRevenue.toLocaleString("en-IN")}`} accent="text-purple-600" />
        <RevenueCard label="Orders" value={metrics.orderCount} />
        <RevenueCard label="AI Upsells" value={metrics.aiUpsells} accent="text-purple-600" />
        <RevenueCard label="Average Order Value" value={`₹${metrics.averageOrderValue.toLocaleString("en-IN")}`} />
        <RevenueCard label="AI Conversion" value={metrics.aiConversion} suffix="%" accent="text-flip-green" />
      </div>

      <RevenueChart organicRevenue={metrics.organicRevenue} aiGeneratedRevenue={metrics.aiGeneratedRevenue} totalRevenue={metrics.totalRevenue} />

      {metrics.orderCount === 0 && <p className="text-sm text-gray-400">No confirmed payments yet — complete an AI-assisted purchase to see revenue here.</p>}
    </div>
  );
}
