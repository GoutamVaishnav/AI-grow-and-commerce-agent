import productsData from "@/data/products.json";

/**
 * All product reads go through here so both the human UI and the AI
 * agent tools share one source of truth. Nothing here ever trusts
 * data coming from the client — it only returns what's in products.json.
 */

export function getAllProducts() {
  return productsData;
}

export function getProductById(id) {
  const numId = Number(id);
  return productsData.find((p) => p.id === numId) || null;
}

export function getProductsByIds(ids) {
  const set = new Set(ids.map(Number));
  return productsData.filter((p) => set.has(p.id));
}

export function getCategories() {
  return [...new Set(productsData.map((p) => p.category))];
}

export function searchProducts({ query = "", category, maxPrice, minPrice, tags } = {}) {
  const q = query.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().trim();
  const queryTokens = q
    .split(/[^a-z0-9\u0900-\u097f]+/i)
    .filter((word) => word.length > 1)
    // Budget numbers are applied separately through maxPrice/minPrice, not
    // used as a product-name requirement.
    .filter((word) => !/^\d+$/.test(word))
    .filter((word) => !SEARCH_STOP_WORDS.has(word));

  const matches = productsData.filter((p) => {
    if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
    if (typeof maxPrice === "number" && p.price > maxPrice) return false;
    if (typeof minPrice === "number" && p.price < minPrice) return false;
    if (tags && tags.length && !tags.some((t) => p.tags.includes(t.toLowerCase()))) return false;
    if (!q) return true;
    const haystack = `${p.name} ${p.category} ${p.brand} ${p.tags.join(" ")}`.toLowerCase();
    const compactHaystack = haystack.replace(/[^a-z0-9]/g, "");
    const compactQuery = q.replace(/[^a-z0-9]/g, "");
    return queryTokens.length
      ? queryTokens.some((word) => haystack.includes(word)) || (compactQuery.length > 2 && compactHaystack.includes(compactQuery))
      : true;
  });

  return matches.sort((a, b) => {
    const aScore = relevanceScore(a, queryTokens, q, maxPrice);
    const bScore = relevanceScore(b, queryTokens, q, maxPrice);
    return bScore - aScore;
  });
}

export function getRelatedProducts(id) {
  const product = getProductById(id);
  if (!product) return [];
  return getProductsByIds(product.relatedProducts);
}

export function isInStock(id, quantity = 1) {
  const product = getProductById(id);
  return !!product && product.stock >= quantity;
}

const SEARCH_STOP_WORDS = new Set([
  "i", "am", "for", "the", "and", "with", "under", "below", "within", "want", "need", "show", "find", "me",
  "gift", "present", "friend", "shopping", "product", "products",
  "mujhe", "mujhe", "chahiye", "dikhao", "dikhaiye", "wala", "wali", "karo", "karna", "hai", "ke", "ki", "ka", "tak",
]);

function relevanceScore(product, queryTokens, query, maxPrice) {
  const haystack = `${product.name} ${product.category} ${product.brand} ${product.tags.join(" ")}`.toLowerCase();
  const compactHaystack = haystack.replace(/[^a-z0-9]/g, "");
  const compactQuery = query.replace(/[^a-z0-9]/g, "");
  const tokenMatches = queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 5 : 0), 0);
  const exactProductMatch = compactQuery.length > 2 && compactHaystack.includes(compactQuery) ? 30 : 0;
  const budgetScore = typeof maxPrice === "number" ? Math.max(0, (maxPrice - product.price) / Math.max(maxPrice, 1)) * 2 : 0;
  return exactProductMatch + tokenMatches + product.rating + Math.log10(product.reviews + 1) + budgetScore + (product.stock > 0 ? 1 : -20);
}
