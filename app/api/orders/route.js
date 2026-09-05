import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listOrderRecords } from "@/lib/commerceStore";

// A shopper can only read orders created while signed in with their account.
export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const orders = await listOrderRecords();
  const ownOrders = orders.filter((order) => order.customer?.id === session.id || order.customer?.email === session.email);
  return NextResponse.json({ orders: ownOrders });
}
