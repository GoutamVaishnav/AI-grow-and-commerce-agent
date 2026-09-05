import { decideNextAction, generateReply } from "@/lib/grok";
import * as tools from "@/agent/tools";
import { calculateCart } from "@/lib/cart";

/**
 * A minimal LangGraph-shaped state machine:
 *
 *   START -> understandRequest -> chooseTool -> executeTool
 *         -> processResult -> generateResponse -> END
 *
 * Each node is a small pure-ish function that takes/returns "state".
 * This mirrors a LangGraph StateGraph (nodes + edges over shared state)
 * without pulling in the extra dependency, so the flow is easy to trace
 * and just as easy to port to @langchain/langgraph's StateGraph if the
 * project grows past a hackathon.
 */

const TOOL_MAP = {
  search_products: (state) => tools.searchProducts(state.action.args),
  get_product_details: (state) => tools.getProductDetails(state.action.args),
  compare_products: (state) => tools.compareProducts(state.action.args),
  check_stock: (state) => tools.checkStock(state.action.args),
  get_related_products: (state) => tools.getRelatedProducts(state.action.args),
  get_cart: (state) => tools.getCart({ cartItems: state.cartItems, ...state.action.args }),
};

const CART_MUTATING_TOOLS = new Set(["add_to_cart", "remove_from_cart", "create_order"]);

export async function runAgent({ message, cartItems = [], lastToolResult = null }) {
  let state = { message, cartItems, lastToolResult, action: null, toolResult: null, reply: null };

  state = await understandRequest(state);
  state = await chooseAndExecuteTool(state);
  state = await generateResponse(state);

  return {
    reply: state.reply,
    action: state.action,
    toolResult: state.toolResult,
    cartItems: state.cartItems,
  };
}

async function understandRequest(state) {
  const cartSummary = calculateCart(state.cartItems);
  const action = await decideNextAction({
    message: state.message,
    cartSummary,
    lastToolResult: state.lastToolResult,
  });
  return { ...state, action };
}

async function chooseAndExecuteTool(state) {
  const { action } = state;

  if (!action || action.tool === "none") {
    return { ...state, toolResult: null, reply: action?.args?.reply || null };
  }

  if (!ALLOWED_TOOL_NAMES.has(action.tool)) {
    return { ...state, toolResult: { status: "FAILED", result: { error: "Tool not permitted" } } };
  }

  if (action.tool === "add_to_cart") {
    const { toolResult, cartItems } = tools.addToCart({ cartItems: state.cartItems, ...action.args, reason: action.reason });
    return { ...state, toolResult, cartItems };
  }

  if (action.tool === "remove_from_cart") {
    const { toolResult, cartItems } = tools.removeFromCart({ cartItems: state.cartItems, ...action.args, reason: action.reason });
    return { ...state, toolResult, cartItems };
  }

  if (action.tool === "create_order") {
    const toolResult = tools.createOrder({ cartItems: state.cartItems, ...action.args, reason: action.reason });
    return { ...state, toolResult };
  }

  const handler = TOOL_MAP[action.tool];
  if (!handler) {
    return { ...state, toolResult: { status: "FAILED", result: { error: "Unknown tool" } } };
  }
  const toolResult = handler({ ...state, action: { ...action, args: { ...action.args, reason: action.reason } } });
  return { ...state, toolResult };
}

async function generateResponse(state) {
  if (state.reply) return state;
  if (!state.toolResult) {
    return { ...state, reply: "I'm here to help you find and buy products — what are you looking for?" };
  }
  const reply = await generateReply({
    message: state.message,
    toolName: state.action.tool,
    toolResult: state.toolResult,
  });
  return { ...state, reply };
}

const ALLOWED_TOOL_NAMES = new Set([
  "search_products",
  "get_product_details",
  "compare_products",
  "check_stock",
  "get_related_products",
  "add_to_cart",
  "remove_from_cart",
  "get_cart",
  "create_order",
]);

export { CART_MUTATING_TOOLS };
