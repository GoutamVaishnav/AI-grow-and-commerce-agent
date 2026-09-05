import { SYSTEM_PROMPT } from "@/agent/prompts";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

/**
 * Asks Grok (or the offline fallback) to decide the next tool call.
 * Returns { tool, args, reason }. The LLM never touches product data
 * directly — it only ever names a tool + arguments; agent/graph.js is
 * what actually executes the tool against products.json.
 */
export async function decideNextAction({ message, cartSummary, lastToolResult }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return ruleBasedFallback({ message, cartSummary, lastToolResult });
  }

  try {
    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-2-latest",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({ customerMessage: message, currentCart: cartSummary, lastToolResult: lastToolResult || null }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return ruleBasedFallback({ message, cartSummary, lastToolResult });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const parsed = safeParseJson(text);
    if (parsed?.tool && parsed.tool !== "none") return parsed;
    // Do not let an ambiguous LLM "none" discard a product-like query or
    // contextual request. The deterministic router preserves catalog access.
    if (parsed?.tool === "none") {
      const fallback = ruleBasedFallback({ message, cartSummary, lastToolResult });
      return fallback.tool === "none" ? parsed : fallback;
    }
    return ruleBasedFallback({ message, cartSummary, lastToolResult });
  } catch {
    return ruleBasedFallback({ message, cartSummary, lastToolResult });
  }
}

/**
 * Asks Grok (or the fallback) to turn a tool result into a short,
 * natural-language reply grounded only in that result.
 */
export async function generateReply({ message, toolName, toolResult }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return ruleBasedReply({ message, toolName, toolResult });
  }

  try {
    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-2-latest",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You explain a commerce tool's result to a customer in 1-3 short, friendly sentences. Use ONLY numbers/names present in the tool result JSON. Never invent data. Plain text only, no markdown.",
          },
          {
            role: "user",
            content: `Customer said: "${message}"\nTool "${toolName}" returned: ${JSON.stringify(toolResult)}`,
          },
        ],
      }),
    });
    if (!response.ok) return ruleBasedReply({ message, toolName, toolResult });
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || ruleBasedReply({ message, toolName, toolResult });
  } catch {
    return ruleBasedReply({ message, toolName, toolResult });
  }
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

/* ---------------------------------------------------------------- */
/* Offline fallback: a small rule-based NLU so the demo always works */
/* even without an XAI_API_KEY configured.                           */
/* ---------------------------------------------------------------- */

// These identify a shopping request. Do not turn them into a category filter:
// the catalog is supplied by DummyJSON and its categories can change whenever
// it is re-seeded. The product search itself matches title, brand, tags and
// the current category names.
const PRODUCT_KEYWORDS = [
  "running shoe", "running shoes", "jogging shoe", "sneaker", "sneakers",
  "phone", "smartphone", "mobile", "headphone", "earphone", "earbud",
  "smartwatch", "smart watch", "fitness watch", "t-shirt", "tshirt", "tee",
  "jeans", "denim", "socks", "water bottle", "gym gloves", "yoga mat",
  "dumbbell", "skipping rope", "foam roller", "serum", "face wash",
  "moisturizer", "sunscreen", "wall clock", "lamp", "photo frame", "cushion",
  "mixer", "kettle", "air fryer", "toaster",
];

function ruleBasedFallback({ message, cartSummary, lastToolResult }) {
  let text = normalizeHinglish(message || "");
  text = text.toLowerCase();
  const contextProduct = getContextProduct(lastToolResult);

  const suggestedId = contextProduct?.id;
  if (/(?:cart|basket)\s*(?:me|mein)?\s*(?:add|daal|dal)/.test(text) && suggestedId) {
    return { tool: "add_to_cart", args: { productId: suggestedId, quantity: 1 }, reason: "Customer confirmed adding the recommended product" };
  }

  if (/(suggest|recommend|aur kuch|or kuch|kuch aur|accessor)/.test(text) && contextProduct) {
    return {
      tool: "get_related_products",
      args: { productId: contextProduct.id },
      reason: "Customer asked for a complementary suggestion",
    };
  }

  if (/(checkout|payment|pay now|pay|order kar|khareed|buy now|bill)/.test(text)) {
    if (!cartSummary?.lines?.length) {
      return { tool: "none", args: { reply: "Aapka cart abhi empty hai. Pehle koi product add karte hain." }, reason: "Checkout requested without cart items" };
    }
    return {
      tool: "create_order",
      args: {},
      reason: "Customer asked to review their order and continue to payment",
    };
  }

  if (/\b(add|buy) (it|this|them|that)\b/.test(text) || (/\badd\b/.test(text) && /\bcart\b/.test(text))) {
    const suggestedId = lastToolResult?.result?.products?.[0]?.id || lastToolResult?.result?.product?.id;
    if (suggestedId) {
      return { tool: "add_to_cart", args: { productId: suggestedId, quantity: 1 }, reason: "Customer confirmed adding the recommended product" };
    }
  }

  if (/\byes\b/.test(text) && lastToolResult?.action === "GET_RELATED_PRODUCTS") {
    const suggestedId = lastToolResult?.result?.products?.[0]?.id;
    if (suggestedId) {
      return { tool: "add_to_cart", args: { productId: suggestedId, quantity: 1, addedBy: "ai" }, reason: "Customer accepted the upsell suggestion" };
    }
  }

  if (/\bcompare\b/.test(text)) {
    return { tool: "search_products", args: { query: text }, reason: "Looking up products to compare" };
  }

  if (/\bcart\b/.test(text) && /(show|view|what.?s in)/.test(text)) {
    return { tool: "get_cart", args: {}, reason: "Customer asked to see their cart" };
  }

  const priceMatch = text.match(/(?:under|below|less than|within)\s*(?:rs\.?|₹|inr)?\s*(\d{2,7})/);
  const hindiPriceMatch = text.match(/(?:rs\.?|inr)?\s*(\d{2,7})\s*(?:tak|ke andar|se kam)/);
  const maxPrice = priceMatch ? Number(priceMatch[1]) : hindiPriceMatch ? Number(hindiPriceMatch[1]) : undefined;

  const hasProductKeyword = PRODUCT_KEYWORDS.some((keyword) => text.includes(keyword));

  if (hasProductKeyword || maxPrice || /\b(need|looking for|want|find|show me|mujhe|chahiye|dikhao|dikhaiye)\b/.test(text)) {
    return {
      tool: "search_products",
      args: { query: text, maxPrice },
      reason: hasProductKeyword || maxPrice ? "Understood intent from product/budget keywords" : "General product search from free text",
    };
  }

  // A product name, brand, or unknown category such as "books" must still
  // reach the catalog. An empty result is more useful than a generic reply.
  if (text.trim().length > 1 && !isGreeting(text)) {
    return {
      tool: "search_products",
      args: { query: text },
      reason: "Searching the catalog for the customer's free-text request",
    };
  }

  return { tool: "none", args: { reply: "I can help you find products, compare options, or manage your cart — what are you shopping for today?" }, reason: "Greeting / unclear intent" };
}

function getContextProduct(lastToolResult) {
  const result = lastToolResult?.result;
  return result?.product || result?.recommendation?.product || result?.products?.[0] || null;
}

function isGreeting(text) {
  return /^(hi|hello|hey|namaste|thanks|thank you|shukriya)[!. ]*$/.test(text.trim());
}

function normalizeHinglish(text) {
  const devanagariReplacements = [
    [new RegExp("\\u091c\\u0942\\u0924\\u0947|\\u091c\\u0942\\u0924\\u093e", "g"), "running shoes"],
    [new RegExp("\\u092b\\u093c\\u094b\\u0928|\\u092b\\u094b\\u0928", "g"), "smartphone"],
    [new RegExp("\\u0918\\u0921\\u093c\\u0940", "g"), "smartwatch"],
    [new RegExp("\\u0915\\u092a\\u0921\\u093c\\u0947", "g"), "t-shirt"],
  ];
  const replacements = [
    [/(?:jute|joota|जूते|जूता)/g, "running shoes"],
    [/(?:mobile|phone|फ़ोन|फोन)/g, "smartphone"],
    // DummyJSON carries watches (rather than a "Smartwatches" category), so
    // retain the searchable word that exists in the current catalog.
    [/(?:smartwatch|smart watch|fitness watch)/g, "watch"],
    [/(?:ghadi|घड़ी|watch)/g, "watch"],
    [/(?:kapde|कपड़े|shirt)/g, "t-shirt"],
    [/(?:kano|earbuds|earphone)/g, "headphones"],
    [/(?:beauty|skin care|skincare)/g, "beauty"],
  ];
  const normalizedDevanagari = devanagariReplacements.reduce(
    (normalized, [pattern, replacement]) => normalized.replace(pattern, replacement),
    text
  );
  return replacements.reduce((normalized, [pattern, replacement]) => normalized.replace(pattern, replacement), normalizedDevanagari);
}

function ruleBasedReply({ toolName, toolResult }) {
  const result = toolResult?.result || {};
  switch (toolName) {
    case "search_products": {
      const products = result.products || [];
      if (!products.length) return "I couldn't find anything matching that — want to try a different budget or category?";
      const top = products[0];
      return `I found ${products.length} option${products.length > 1 ? "s" : ""}. I'd recommend ${top.name} at ₹${top.price} — it has a ${top.rating} rating and is in stock.`;
    }
    case "add_to_cart": {
      if (toolResult.status === "FAILED") return `Sorry, I couldn't add that — ${result.error}.`;
      return `Added ${result.product?.name} to your cart. Your cart total is now ₹${result.cartTotal}.`;
    }
    case "get_related_products": {
      const products = result.products || [];
      if (!products.length) return "No extra accessories to suggest for that one.";
      const top = products[0];
      return `You may also want ${top.name} for ₹${top.price} — it's a good match. Want me to add it?`;
    }
    case "get_cart": {
      if (!result.lines?.length) return "Your cart is empty right now.";
      return `Your cart has ${result.lines.length} item(s) totaling ₹${result.total}, including ₹${result.aiGeneratedRevenue} from AI recommendations.`;
    }
    case "compare_products": {
      const products = result.products || [];
      if (products.length < 2) return "I need at least two valid products to compare.";
      const [a, b] = products;
      const cheaper = a.price <= b.price ? a : b;
      return `${a.name} is ₹${a.price} with a ${a.rating} rating, ${b.name} is ₹${b.price} with a ${b.rating} rating. ${cheaper.name} is the better value on price.`;
    }
    case "check_stock": {
      return result.available ? `Yes, it's in stock (${result.stock} available).` : `That's currently out of stock.`;
    }
    case "create_order": {
      if (toolResult.status === "FAILED") return `I couldn't create the order — ${result.error}.`;
      return `Your order ${result.order.orderId} is ready for ₹${result.order.total}. Head to checkout to confirm and pay.`;
    }
    default:
      return "Done.";
  }
}
