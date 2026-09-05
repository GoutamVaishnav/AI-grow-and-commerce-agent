import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import { recordAgentActivity } from "@/lib/commerceStore";

// Records customer acceptance of an AI suggestion without trusting any
// price, quantity, or revenue values from the browser.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const product = getProductById(body.productId);
  if (!product || !body.recommendationId) {
    return NextResponse.json({ error: "A valid recommendationId and productId are required" }, { status: 400 });
  }

  await recordAgentActivity({
    action: "RECOMMENDATION_ACCEPTED",
    reason: "Customer accepted an AI recommendation",
    input: { recommendationId: String(body.recommendationId), productId: product.id },
    result: { product: product.name },
    revenueImpact: 0,
  });
  return NextResponse.json({ accepted: true });
}
