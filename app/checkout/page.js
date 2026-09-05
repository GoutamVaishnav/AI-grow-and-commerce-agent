"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readCart, writeCart, calculateCart } from "@/lib/cart";
import { saveOrder } from "@/lib/orders";
import CheckoutSummary from "@/components/CheckoutSummary";
import PaymentModal from "@/components/PaymentModal";

const DEMO_ADDRESS = {
  name: "Aarav Mehta",
  line1: "42 Market Road",
  city: "Nagpur",
  state: "Maharashtra",
  pincode: "440001",
  phone: "+91 90000 00000",
};

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [demoPaymentMode, setDemoPaymentMode] = useState("SUCCESS");
  const [modal, setModal] = useState(null);
  const [authState, setAuthState] = useState("loading");
  const router = useRouter();

  useEffect(() => {
    setItems(readCart());
    setMounted(true);
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data) => setAuthState(data.user ? "signed-in" : "signed-out"))
      .catch(() => setAuthState("signed-out"));
  }, []);

  if (!mounted) return null;
  const cart = calculateCart(items);

  if (authState === "loading") return null;
  if (authState === "signed-out") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Sign in to checkout</h1>
        <p className="mt-2 text-sm text-gray-500">Create an account or sign in to place your order securely.</p>
        <div className="mt-5 flex justify-center gap-3">
          <a href="/login?next=/checkout" className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white">Login</a>
          <a href="/signup?next=/checkout" className="rounded border px-4 py-2 text-sm font-semibold">Sign up</a>
        </div>
      </div>
    );
  }

  async function handlePay() {
    setModal({ status: "processing" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, address: DEMO_ADDRESS, paymentMode: demoPaymentMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModal({ status: "failure", failureReason: data.error || "Something went wrong." });
        return;
      }

      if (data.payment.provider === "RAZORPAY") {
        setModal(null);
        await completeRazorpayPayment(data.order, data.payment);
        return;
      }

      saveOrder(data.order);
      if (data.payment.success) {
        writeCart([]);
        setItems([]);
        setModal({ status: "success", order: data.order });
      } else {
        setModal({ status: "failure", failureReason: data.payment.reason });
      }
    } catch (error) {
      setModal({ status: "failure", failureReason: error.message || "Network error — please try again." });
    }
  }

  async function completeRazorpayPayment(order, payment) {
    try {
      const response = await openRazorpayCheckout({ order, payment });
      setModal({ status: "processing" });
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, ...response }),
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verified.error || "Payment could not be verified.");

      saveOrder(verified.order);
      writeCart([]);
      setItems([]);
      setModal({ status: "success", order: verified.order });
    } catch (error) {
      setModal({ status: "failure", failureReason: error.message || "Payment was not completed. Your cart is safe." });
    }
  }

  if (!cart.lines.length && !modal) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 flex flex-col gap-4">
        <div className="bg-white border rounded-md p-4">
          <h2 className="font-semibold mb-3">Delivery Address</h2>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p className="font-medium">{DEMO_ADDRESS.name}</p>
            <p>{DEMO_ADDRESS.line1}</p>
            <p>{DEMO_ADDRESS.city}, {DEMO_ADDRESS.state} — {DEMO_ADDRESS.pincode}</p>
            <p>{DEMO_ADDRESS.phone}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">Sample customer details used only for this hackathon prototype.</p>
        </div>

        <div className="bg-white border rounded-md p-4">
          <h2 className="font-semibold mb-1">Confirm payment</h2>
          <p className="text-sm text-gray-500 mb-4">
            Review the total above. Payment opens only after your explicit click; the AI cannot trigger it by itself.
          </p>
          <details className="mb-4 text-xs text-gray-500">
            <summary className="cursor-pointer">Demo fallback settings</summary>
            <div className="flex items-center gap-4 mt-2">
              <span>Outcome when Razorpay Test Mode keys are not configured:</span>
              <label className="flex items-center gap-1">
                <input type="radio" checked={demoPaymentMode === "SUCCESS"} onChange={() => setDemoPaymentMode("SUCCESS")} />
                Success
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" checked={demoPaymentMode === "FAILURE"} onChange={() => setDemoPaymentMode("FAILURE")} />
                Failure
              </label>
            </div>
          </details>
          <button onClick={handlePay} className="w-full bg-orange-500 text-white font-bold py-3 rounded-sm hover:brightness-95">
            Continue to Payment ₹{cart.total.toLocaleString("en-IN")}
          </button>
          <p className="text-xs text-gray-400 mt-2">Razorpay Test Mode is used automatically when its server-side keys are configured.</p>
        </div>
      </div>

      <CheckoutSummary cart={cart} />

      {modal && (
        <PaymentModal
          status={modal.status.toLowerCase()}
          order={modal.order}
          failureReason={modal.failureReason}
          onClose={() => setModal(null)}
          onRetry={() => handlePay()}
          onViewOrder={() => router.push(`/orders?highlight=${modal.order.orderId}`)}
        />
      )}
    </div>
  );
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout. Please check your connection and retry."));
    document.body.appendChild(script);
  });
}

async function openRazorpayCheckout({ order, payment }) {
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: "ShopAgent AI",
      description: `Order ${order.orderId}`,
      order_id: payment.orderId,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("Payment was cancelled. Your cart is safe.")) },
      theme: { color: "#2874f0" },
    });
    checkout.open();
  });
}
