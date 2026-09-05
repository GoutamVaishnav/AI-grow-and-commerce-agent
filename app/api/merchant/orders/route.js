import { NextResponse } from "next/server";
import { listOrderRecords } from "@/lib/commerceStore";
import { getSessionFromRequest, isMerchant } from "@/lib/auth";

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isMerchant(session)) return NextResponse.json({ error: "Merchant access is required." }, { status: 403 });
  const orders = await listOrderRecords();
  return NextResponse.json({ orders });
}
