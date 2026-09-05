"use client";

import { useEffect, useState } from "react";
import { getAllProducts } from "@/lib/products";

const CAMPAIGNS_KEY = "shopagent_campaigns";

function readCampaigns() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CAMPAIGNS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeCampaigns(campaigns) {
  window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

// AI product selection: naive relevance match against the campaign's
// target keyword, using the same tag/category fields the shopping
// agent already relies on — deterministic, not invented by an LLM.
function selectCampaignProducts(target) {
  const q = target.toLowerCase();
  return getAllProducts()
    .filter((p) => p.tags.some((t) => t.includes(q)) || p.category.toLowerCase().includes(q))
    .slice(0, 6);
}

export default function MerchantCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [offer, setOffer] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCampaigns(readCampaigns());
    setMounted(true);
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    if (!name || !target) return;
    const products = selectCampaignProducts(target);
    const campaign = {
      id: `CAMP_${Date.now()}`,
      name,
      target,
      offer,
      products,
      status: "Ready for Review",
      createdAt: new Date().toISOString(),
    };
    const updated = [campaign, ...campaigns];
    setCampaigns(updated);
    writeCampaigns(updated);
    setName("");
    setTarget("");
    setOffer("");
  }

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Campaigns</h1>
        <p className="text-sm text-gray-500">
          Create a campaign target — the AI selects relevant products from the catalog for you to review.
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-white border rounded-md p-4 grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Campaign name, e.g. "Running Season Sale"'
          className="border rounded px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder='Target keyword, e.g. "running"'
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder='Offer, e.g. "10% off running accessories"'
          className="border rounded px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-flip-blue text-white font-semibold rounded py-2 text-sm sm:col-span-2">
          Let AI Select Products
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white border rounded-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-gray-500">Target: {c.target} · {c.offer}</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded">{c.status}</span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {c.products.length ? (
                c.products.map((p) => (
                  <div key={p.id} className="border rounded px-2 py-1 text-xs whitespace-nowrap">
                    {p.name} — ₹{p.price}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No matching products found for this target.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
