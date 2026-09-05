import AIChat from "@/components/AIChat";

export default function AIShoppingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">AI Shopping Assistant</h1>
        <p className="text-sm text-gray-500">
          Describe what you need in plain language — the agent searches the real catalog, compares
          products, and can add items to your cart. It never invents prices, stock, or discounts.
        </p>
      </div>
      <AIChat />
    </div>
  );
}
