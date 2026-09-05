import { NextResponse } from "next/server";
import { runAgent } from "@/agent/graph";
import { recordAgentActivity } from "@/lib/commerceStore";

// POST /api/ai/chat
// Body: { message, cartItems, lastToolResult }
// Returns: { reply, action, toolResult, cartItems }
//
// This is the endpoint behind the on-site "AI Shopping" chat. The
// browser sends its current cart (from localStorage) with every turn
// since this route is stateless; the agent may return an updated cart
// which the client then persists back to localStorage.
export async function POST(request) {
  try {
    const body = await request.json();
    const { message, cartItems = [], lastToolResult = null } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const result = await runAgent({ message, cartItems, lastToolResult });

    if (result.toolResult && result.action) {
      await recordAgentActivity({
        action: result.toolResult.action || result.action.tool?.toUpperCase(),
        customerMessage: message,
        reason: result.toolResult.reason || result.action.reason,
        input: result.toolResult.input || {},
        result: summarizeResult(result.toolResult.result),
        revenueImpact: result.toolResult.revenueImpact || 0,
        status: result.toolResult.status || "SUCCESS",
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Agent failed to process the request", details: String(err) }, { status: 500 });
  }
}

function summarizeResult(result) {
  if (!result) return {};
  const { products, suggestions, ...rest } = result;
  return {
    ...rest,
    productCount: products?.length || 0,
    suggestionCount: suggestions?.length || 0,
  };
}
