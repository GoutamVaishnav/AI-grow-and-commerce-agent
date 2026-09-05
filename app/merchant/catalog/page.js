import { getAllProducts } from "@/lib/products";
import AIReadinessScore from "@/components/AIReadinessScore";

function computeReadiness(products) {
  const checks = [
    { key: "description", label: "Product descriptions", test: (p) => !!p.description },
    { key: "price", label: "Prices", test: (p) => typeof p.price === "number" },
    { key: "stock", label: "Inventory", test: (p) => typeof p.stock === "number" },
    { key: "category", label: "Categories", test: (p) => !!p.category },
    { key: "tags", label: "Product tags", test: (p) => p.tags?.length > 0 },
    { key: "related", label: "Related products", test: (p) => p.relatedProducts?.length > 0 },
    { key: "image", label: "Images", test: (p) => !!p.image },
    { key: "attributes", label: "Structured attributes", test: (p) => Object.keys(p.attributes || {}).length > 0 },
  ];

  const results = checks.map((c) => ({
    ...c,
    passRate: products.filter((p) => c.test(p)).length / products.length,
  }));

  const score = Math.round((results.reduce((sum, r) => sum + r.passRate, 0) / results.length) * 100);
  const passed = results.filter((r) => r.passRate === 1);
  const incomplete = results.filter((r) => r.passRate < 1);

  const warnings = incomplete.map((r) => {
    const missingCount = products.length - Math.round(r.passRate * products.length);
    return `${missingCount} product${missingCount === 1 ? "" : "s"} missing ${r.label.toLowerCase()}`;
  });

  return { score, checks: passed, warnings };
}

export default function MerchantCatalogPage() {
  const products = getAllProducts();
  const readiness = computeReadiness(products);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">AI-Readable Catalog</h1>
        <p className="text-sm text-gray-500">
          This is the same structured feed an AI buyer receives from{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">GET /api/catalog</code> — instead of scraping your
          storefront HTML.
        </p>
      </div>

      <AIReadinessScore score={readiness.score} checks={readiness.checks} warnings={readiness.warnings} />

      <div className="bg-white border rounded-md p-4">
        <h2 className="font-semibold mb-3">Sample Catalog Response</h2>
        <pre className="bg-gray-900 text-green-400 text-xs rounded p-4 overflow-x-auto">
{JSON.stringify(
  {
    merchant: { name: "ShopAgent Store", currency: "INR" },
    products: products.slice(0, 2).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      tags: p.tags,
      relatedProducts: p.relatedProducts,
    })),
  },
  null,
  2
)}
        </pre>
      </div>
    </div>
  );
}
