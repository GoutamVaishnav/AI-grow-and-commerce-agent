import { NextResponse } from "next/server";
import { calculateCart } from "@/lib/cart";
import { buildOrder } from "@/lib/orders";
import { createOrderRecord, updateOrderRecord } from "@/lib/commerceStore";
import { preparePayment } from "@/lib/payment";
import { getSessionFromRequest } from "@/lib/auth";

// The client can send only product IDs, quantities, and an explicit payment
// attempt. The server recalculates prices and stock before it creates either
// a Razorpay Test Mode order or a local demo payment.
export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Please sign in before checkout." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { items = [], address, paymentMode = "SUCCESS" } = body;
    const cartResult = calculateCart(items);

    if (!items.length || !cartResult.lines.length) {
      return NextResponse.json({ error: "Cart is empty or invalid" }, { status: 400 });
    }
    if (cartResult.hasOutOfStock) {
      return NextResponse.json({ error: "Some items are out of stock", lines: cartResult.lines }, { status: 409 });
    }

    let order = buildOrder({ cartResult, address, paymentMode });
    order.customer = { id: session.id, name: session.name, email: session.email };
    await createOrderRecord(order);

    const payment = await preparePayment({ orderId: order.orderId, amount: order.total, mode: paymentMode });
    if (payment.provider === "RAZORPAY") {
      order = await updateOrderRecord(order.orderId, {
        paymentProvider: "RAZORPAY",
        providerOrderId: payment.orderId,
        status: "PAYMENT_PENDING",
      });
      return NextResponse.json({ order, payment });
    }

    order = await updateOrderRecord(order.orderId, {
      paymentProvider: "SIMULATED",
      status: payment.success ? "CONFIRMED" : "PAYMENT_FAILED",
      paymentId: payment.paymentId,
      failureReason: payment.reason,
    });
    return NextResponse.json({ order, payment });
  } catch (error) {
    return NextResponse.json({ error: "Unable to prepare payment", details: error.message }, { status: 500 });
  }
}
