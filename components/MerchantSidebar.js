"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/merchant", label: "Dashboard", icon: "📊" },
  { href: "/merchant/products", label: "Products", icon: "📦" },
  { href: "/merchant/orders", label: "Orders", icon: "🧾" },
  { href: "/merchant/ai-sales", label: "AI Sales", icon: "✨" },
  { href: "/merchant/ai-activity", label: "AI Activity", icon: "🕒" },
  { href: "/merchant/catalog", label: "Catalog", icon: "🔗" },
  { href: "/merchant/campaigns", label: "Campaigns", icon: "📣" },
];

export default function MerchantSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-white border-r min-h-[calc(100vh-56px)] py-4 hidden md:flex flex-col gap-1">
      <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">Merchant</p>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 text-sm flex items-center gap-2 ${
              active ? "bg-violet-50 text-flip-blue font-semibold border-r-2 border-flip-blue" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </aside>
  );
}
