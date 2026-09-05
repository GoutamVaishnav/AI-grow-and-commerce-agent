import crypto from "crypto";

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Creates a provider order only after the application has recalculated the
 * cart on the server. When Test Mode credentials are not configured, the
 * demo retains a deterministic simulated payment path.
 */
export async function preparePayment({ orderId, amount, mode = "SUCCESS" }) {
  if (isRazorpayConfigured()) {
    const providerOrder = await createRazorpayOrder({ orderId, amount });
    return {
      provider: "RAZORPAY",
      success: false,
      status: "PENDING_CUSTOMER_PAYMENT",
      orderId: providerOrder.id,
      amount: providerOrder.amount,
      currency: providerOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  return simulatePayment({ orderId, amount, mode });
}

export function verifyRazorpayPaymentSignature({ providerOrderId, paymentId, signature }) {
  if (!isRazorpayConfigured() || !providerOrderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${providerOrderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

export function verifyRazorpayWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

async function createRazorpayOrder({ orderId, amount }) {
  const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(RAZORPAY_ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: orderId,
      notes: { shopagent_order_id: orderId, source: "shopagent-ai" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to create Razorpay order: ${detail.slice(0, 180)}`);
  }
  return response.json();
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function simulatePayment({ orderId, amount, mode }) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (mode === "FAILURE") {
    return {
      provider: "SIMULATED",
      success: false,
      status: "FAILED",
      paymentId: null,
      orderId,
      amount,
      reason: "Payment declined by bank (simulated).",
    };
  }
  return {
    provider: "SIMULATED",
    success: true,
    status: "CAPTURED",
    paymentId: `PAY_${Date.now()}`,
    orderId,
    amount,
    reason: null,
  };
}
