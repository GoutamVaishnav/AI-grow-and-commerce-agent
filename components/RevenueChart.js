"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RevenueChart({ organicRevenue, aiGeneratedRevenue, totalRevenue }) {
  const data = [
    { name: "Organic", value: organicRevenue },
    { name: "AI", value: aiGeneratedRevenue },
    { name: "Total", value: totalRevenue },
  ];

  return (
    <div className="bg-white border rounded-md p-4">
      <h2 className="font-semibold mb-3">Revenue Breakdown</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
            <Bar dataKey="value" fill="#2874f0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
