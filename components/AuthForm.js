"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to continue.");

      window.dispatchEvent(new Event("auth-updated"));
      const next = searchParams.get("next");
      router.push(next || (data.user.role === "merchant" ? "/merchant" : "/"));
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-violet-50/50 px-4 py-12 flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">ShopAgent AI</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isSignup ? "Sign up to save your shopping journey and check out." : "Sign in to continue shopping and checkout."}
        </p>

        {isSignup && (
          <label className="mt-5 block text-sm font-medium text-gray-700">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} className="mt-1 w-full rounded border px-3 py-2 outline-none focus:border-brand" autoComplete="name" />
          </label>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className="mt-1 w-full rounded border px-3 py-2 outline-none focus:border-brand" autoComplete="email" />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" minLength={8} maxLength={128} className="mt-1 w-full rounded border px-3 py-2 outline-none focus:border-brand" autoComplete={isSignup ? "new-password" : "current-password"} />
          {isSignup && <span className="mt-1 block text-xs font-normal text-gray-400">Use at least 8 characters.</span>}
        </label>

        {error && <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button disabled={loading} className="mt-5 w-full rounded bg-brand py-2.5 font-semibold text-white disabled:bg-gray-300">
          {loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isSignup ? "Already have an account?" : "New to ShopAgent?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-brand hover:underline">
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </form>
    </div>
  );
}
