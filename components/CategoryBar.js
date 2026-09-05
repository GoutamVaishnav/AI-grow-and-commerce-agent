import Link from "next/link";

export default function CategoryBar({ categories }) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex gap-6 overflow-x-auto text-sm font-medium text-gray-700">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/products?category=${encodeURIComponent(cat)}`}
            className="whitespace-nowrap hover:text-flip-blue"
          >
            {cat}
          </Link>
        ))}
      </div>
    </div>
  );
}
