"use client";

import { useEffect, useState } from "react";
import AIActivityTimeline from "@/components/AIActivityTimeline";

export default function MerchantAIActivityPage() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/merchant/activity", { cache: "no-store" });
        const data = await response.json();
        if (active) setEntries(data.activity || []);
      } catch {
        if (active) setEntries([]);
      }
    }
    refresh();
    const interval = window.setInterval(refresh, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!entries) return null;
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">AI Activity</h1>
        <p className="text-sm text-gray-500">Server-recorded actions show the user request, bounded tool, reason, result and attributed revenue.</p>
      </div>
      <div className="bg-white border rounded-md p-4"><AIActivityTimeline entries={entries} /></div>
    </div>
  );
}
