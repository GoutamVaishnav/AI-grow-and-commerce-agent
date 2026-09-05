"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readCart } from "@/lib/cart";

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const update = () => {
      const items = readCart();
      setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
    };
    update();
    window.addEventListener("cart-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("cart-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshAuth = () => {
      fetch("/api/auth/me", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { user: null }))
        .then((data) => {
          if (active) setUser(data.user || null);
        })
        .catch(() => {
          if (active) setUser(null);
        })
        .finally(() => {
          if (active) setAuthReady(true);
        });
    };
    refreshAuth();
    window.addEventListener("auth-updated", refreshAuth);
    window.addEventListener("focus", refreshAuth);
    return () => {
      active = false;
      window.removeEventListener("auth-updated", refreshAuth);
      window.removeEventListener("focus", refreshAuth);
    };
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setProfileOpen(false);
      window.dispatchEvent(new Event("auth-updated"));
      router.push("/");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-flip-blue text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
        <Link href="/" className="flex flex-col leading-none shrink-0">
          <span className="text-xl font-bold italic">ShopAgent</span>
          <span className="text-[10px] text-flip-yellow font-medium tracking-wide">AI POWERED</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="flex items-center bg-white rounded-sm overflow-hidden">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search for products, brands and more"
              className="w-full px-3 py-1.5 text-sm text-gray-800 outline-none"
            />
            <button type="submit" className="px-3 text-flip-blue" aria-label="Search">
              🔍
            </button>
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="hover:text-flip-yellow">Home</Link>
          <Link href="/products" className="hover:text-flip-yellow">Categories</Link>
          <Link href="/ai-shopping" className="hover:text-flip-yellow flex items-center gap-1">
            ✨ AI Shopping
          </Link>
          <Link href="/orders" className="hover:text-flip-yellow">Orders</Link>
        </nav>

        <div className="flex items-center gap-4 text-sm font-medium shrink-0">
          {user?.role === "merchant" && <Link href="/merchant" className="hidden sm:block hover:text-flip-yellow">Merchant</Link>}
          <Link href="/cart" className="relative flex items-center gap-1 hover:text-flip-yellow">
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-flip-yellow text-flip-blue text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {authReady && (user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full outline-none ring-offset-2 ring-offset-flip-blue focus:ring-2 focus:ring-flip-yellow"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-flip-yellow text-sm font-bold text-flip-blue">
                  {getInitials(user.name)}
                </span>
                <span className="hidden max-w-24 truncate text-xs text-white/80 lg:block" title={user.email}>{user.name}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border border-violet-100 bg-white py-2 text-gray-800 shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-2">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-brand">{user.role}</p>
                  </div>
                  <Link href="/orders" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-violet-50">My Orders</Link>
                  {user.role === "merchant" && <Link href="/merchant" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-violet-50">Merchant Dashboard</Link>}
                  <button type="button" onClick={handleLogout} className="mt-1 block w-full border-t border-gray-100 px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login" className="hover:text-flip-yellow">Login</Link>
              <Link href="/signup" className="rounded bg-flip-yellow px-2.5 py-1 text-xs font-bold text-flip-blue">Sign up</Link>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

function getInitials(name) {
  const initials = String(name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "U";
}
