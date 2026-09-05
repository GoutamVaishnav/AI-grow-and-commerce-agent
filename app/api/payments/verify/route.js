import { NextResponse } from "next/server";
import { getOrderRecord, updateOrderRecord } from "@/lib/commerceStore";
import { verifyRazorpayPaymentSignature } from "@/lib/payment";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, razorpay_payment_id: paymentId, razorpay_order_id: providerOrderId, razorpay_signature: signature } = body;
    const order = await getOrderRecord(orderId);

    if (!order || order.status !== "PAYMENT_PENDING" || order.providerOrderId !== providerOrderId) {
      return NextResponse.json({ error: "Payment order is invalid or no longer pending" }, { status: 400 });
    }
    if (!verifyRazorpayPaymentSignature({ providerOrderId, paymentId, signature })) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    const confirmedOrder = await updateOrderRecord(orderId, {
      status: "CONFIRMED",
      paymentId,
      paymentProvider: "RAZORPAY",
      paymentVerifiedAt: new Date().toISOString(),
    });
    return NextResponse.json({ order: confirmedOrder });
  } catch (error) {
    return NextResponse.json({ error: "Unable to verify payment", details: error.message }, { status: 500 });
  }
}
