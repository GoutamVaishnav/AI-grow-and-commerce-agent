import { NextResponse } from "next/server";
import { recordPaymentEvent, updateOrderRecord } from "@/lib/commerceStore";
import { verifyRazorpayWebhookSignature } from "@/lib/payment";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventId = request.headers.get("x-razorpay-event-id");
  if (!(await recordPaymentEvent(eventId))) return NextResponse.json({ received: true, duplicate: true });

  const event = JSON.parse(rawBody);
  const payment = event.payload?.payment?.entity;
  const providerOrderId = payment?.order_id;
  const orderId = payment?.notes?.shopagent_order_id || event.payload?.order?.entity?.receipt;

  if (orderId && providerOrderId && event.event === "payment.captured") {
    await updateOrderRecord(orderId, {
      status: "CONFIRMED",
      paymentId: payment.id,
      paymentProvider: "RAZORPAY",
      providerOrderId,
      capturedAt: new Date().toISOString(),
    });
  }
  if (orderId && event.event === "payment.failed") {
    await updateOrderRecord(orderId, { status: "PAYMENT_FAILED", failureReason: payment?.error_description || "Payment failed" });
  }

  return NextResponse.json({ received: true });
}
