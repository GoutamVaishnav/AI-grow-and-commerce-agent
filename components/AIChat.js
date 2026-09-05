"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { readCart, writeCart, addToCart, calculateCart } from "@/lib/cart";
import { logActivity } from "@/lib/aiActivity";
import AIProductCard from "@/components/AIProductCard";

const STARTERS = [
  "I need running shoes under ₹4000 for daily running.",
  "Compare a Nike and Adidas running shoe.",
  "I need a gift under ₹2000.",
  "Show me smartwatches with good ratings.",
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your ShopAgent AI. Tell me what you're looking for — a product, a budget, or a use-case — and I'll find it, compare it, and help you check out.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastToolResult, setLastToolResult] = useState(null);
  const [acceptedRecommendationIds, setAcceptedRecommendationIds] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const message = text ?? input;
    if (!message.trim() || loading) return;

    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const cartItems = readCart();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, cartItems, lastToolResult }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "The shopping agent could not process that request.");
      }

      if (data.cartItems) {
        writeCart(data.cartItems);
      }

      if (data.toolResult && data.action) {
        logActivity({
          action: data.action.tool?.toUpperCase() || data.toolResult.action,
          customerMessage: message,
          reason: data.toolResult.reason,
          input: data.toolResult.input,
          result: summarizeResult(data.toolResult.result),
          revenueImpact: data.toolResult.revenueImpact || 0,
          status: data.toolResult.status,
        });
      }

      setLastToolResult(data.toolResult ? { action: data.toolResult.action, result: data.toolResult.result } : null);

      const products = extractProducts(data.toolResult);
      const suggestions = extractSuggestions(data.toolResult);
      const recommendation = extractRecommendation(data.toolResult);
      const checkout = extractCheckout(data.toolResult);
      setMessages((m) => [...m, { role: "assistant", text: data.reply, products, recommendation, suggestions, checkout, toolAction: data.toolResult?.action }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `${err.message || "Sorry, something went wrong."} Please try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAdd(product, recommendation = null, suggestions = []) {
    const items = readCart();
    const updated = addToCart(items, product.id, 1, "ai");
    writeCart(updated);
    if (recommendation?.id) {
      setAcceptedRecommendationIds((ids) => (ids.includes(recommendation.id) ? ids : [...ids, recommendation.id]));
      fetch("/api/ai/recommendation-accepted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recommendation.id, productId: product.id }),
      }).catch(() => {});
    }
    const cartResult = calculateCart(updated);
    // Preserve the product the shopper selected for requests such as
    // "suggest something for this" in the next chat turn.
    setLastToolResult({ action: "ADD_TO_CART", result: { product, suggestions } });
    setMessages((m) => [
      ...m,
      { role: "assistant", text: `Added ${product.name} to your cart. Total is now ₹${cartResult.total.toLocaleString("en-IN")}.` },
    ]);
    setMessages((current) => {
      const latest = current[current.length - 1];
      return [...current.slice(0, -1), { ...latest, suggestions }];
    });
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white border rounded-md overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                m.role === "user" ? "bg-flip-blue text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.text}
            </div>
            {m.recommendation && (
              <div className="max-w-md border border-purple-200 bg-purple-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-purple-800">✨ AI advice: best pick for you</p>
                <p className="mt-1 text-gray-800">
                  <span className="font-medium">{m.recommendation.product.name}</span> — {m.recommendation.reason}
                </p>
                <button
                  onClick={() => handleQuickAdd(m.recommendation.product, m.recommendation, m.suggestions)}
                  disabled={acceptedRecommendationIds.includes(m.recommendation.id)}
                  className="mt-2 bg-purple-600 disabled:bg-purple-200 disabled:text-purple-700 text-white font-semibold text-xs px-3 py-1.5 rounded"
                >
                  Accept AI pick · Add to cart
                </button>
              </div>
            )}
            {m.products?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
                {m.products.map((p) => (
                  <AIProductCard key={p.id} product={p} onAdd={(product) => handleQuickAdd(product, m.recommendation, m.suggestions)} />
                ))}
              </div>
            )}
            {m.suggestions?.length > 0 && (
              <div className="max-w-full">
                <p className="text-xs font-semibold text-purple-700 mb-1">AI also suggests</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {m.suggestions.map((p) => (
                    <AIProductCard key={p.id} product={p} onAdd={(product) => handleQuickAdd(product, m.recommendation, m.suggestions)} />
                  ))}
                </div>
              </div>
            )}
            {m.checkout && (
              <Link
                href={m.checkout.checkoutUrl}
                className="bg-orange-500 hover:brightness-95 text-white text-sm font-semibold px-4 py-2 rounded"
              >
                Review & Pay ₹{m.checkout.total.toLocaleString("en-IN")}
              </Link>
            )}
          </div>
        ))}
        {loading && <div className="text-sm text-gray-400">ShopAgent AI is thinking…</div>}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-gray-50 border rounded-full px-3 py-1.5 hover:bg-gray-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="border-t p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ShopAgent AI to find, compare, or add products…"
          className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:border-flip-blue"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-flip-blue disabled:bg-gray-300 text-white font-medium px-4 rounded text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function extractProducts(toolResult) {
  if (!toolResult?.result) return [];
  const r = toolResult.result;
  if (r.products) return r.products;
  if (r.product) return [r.product];
  return [];
}

function extractSuggestions(toolResult) {
  return toolResult?.result?.suggestions || [];
}

function extractRecommendation(toolResult) {
  return toolResult?.result?.recommendation || null;
}

function extractCheckout(toolResult) {
  const result = toolResult?.result;
  if (!result?.approvalRequired || !result?.order?.total || !result?.checkoutUrl) return null;
  return { total: result.order.total, checkoutUrl: result.checkoutUrl };
}

function summarizeResult(result) {
  if (!result) return {};
  const { products, ...rest } = result;
  return products ? { ...rest, productCount: products.length } : rest;
}
