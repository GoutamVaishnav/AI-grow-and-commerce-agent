import { getAllProducts } from "@/lib/products";

export default function MerchantProductsPage() {
  const products = getAllProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Products ({products.length})</h1>
      <div className="bg-white border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Price</th>
              <th className="text-left px-4 py-2">Stock</th>
              <th className="text-left px-4 py-2">Rating</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-gray-500">{p.category}</td>
                <td className="px-4 py-2">₹{p.price.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2">
                  <span className={p.stock === 0 ? "text-red-500 font-medium" : ""}>{p.stock}</span>
                </td>
                <td className="px-4 py-2">{p.rating} ★</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
