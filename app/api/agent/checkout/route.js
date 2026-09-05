import { NextResponse } from "next/server";
import { getSessionCart, setSessionCart } from "@/lib/agentSession";
import { calculateCart } from "@/lib/cart";
import { buildOrder } from "@/lib/orders";
import { createOrderRecord, updateOrderRecord } from "@/lib/commerceStore";
import { preparePayment } from "@/lib/payment";

// POST /api/agent/checkout
// Body: { sessionId, address, confirmPayment: boolean, paymentMode }
//
// Guardrail: the AI buyer can build a checkout summary and even create
// an order in PAYMENT_PENDING state, but the actual charge only happens
// when confirmPayment === true is sent explicitly — mirroring the
// on-site rule that the agent never autonomously charges the customer.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, address, confirmPayment = false, paymentMode = "SUCCESS" } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const cartItems = getSessionCart(sessionId);
  const cartResult = calculateCart(cartItems);

  if (!cartItems.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (cartResult.hasOutOfStock) {
    return NextResponse.json({ error: "Some items are out of stock", lines: cartResult.lines }, { status: 409 });
  }

  const order = buildOrder({ cartResult, address, paymentMode });

  if (!confirmPayment) {
    return NextResponse.json({
      status: "AWAITING_CONFIRMATION",
      message: "Order summary ready. Resend with confirmPayment: true to charge the customer.",
      order,
    });
  }

  await createOrderRecord(order);
  const payment = await preparePayment({ orderId: order.orderId, amount: order.total, mode: paymentMode });
  if (payment.provider === "RAZORPAY") {
    const pendingOrder = await updateOrderRecord(order.orderId, {
      paymentProvider: "RAZORPAY",
      providerOrderId: payment.orderId,
      status: "PAYMENT_PENDING",
    });
    return NextResponse.json({
      status: "AWAITING_CUSTOMER_PAYMENT",
      message: "Present the payment checkout to the customer. The customer must complete payment personally.",
      order: pendingOrder,
      payment,
    });
  }

  const completedOrder = await updateOrderRecord(order.orderId, {
    status: payment.success ? "CONFIRMED" : "PAYMENT_FAILED",
    paymentId: payment.paymentId,
    paymentProvider: "SIMULATED",
    failureReason: payment.reason,
  });

  if (payment.success) {
    setSessionCart(sessionId, []); // clear cart only after a successful charge
  }

  return NextResponse.json({ status: completedOrder.status, order: completedOrder, payment });
}
