/**
 * Downloads the demo catalog from DummyJSON and adapts it to ShopAgent's
 * server-validated product schema.
 *
 * Run with: npm run seed
 */
const fs = require("fs");
const path = require("path");

const DUMMYJSON_PRODUCTS_URL = "https://dummyjson.com/products?limit=0";
const INR_PER_USD = 85;

async function main() {
  const response = await fetch(DUMMYJSON_PRODUCTS_URL);
  if (!response.ok) {
    throw new Error(`DummyJSON catalog request failed with ${response.status}`);
  }

  const payload = await response.json();
  const sourceProducts = Array.isArray(payload.products) ? payload.products : [];
  if (!sourceProducts.length) {
    throw new Error("DummyJSON returned an empty product catalog");
  }

  const products = sourceProducts.map(adaptProduct);
  wireRelatedProducts(products);

  const outPath = path.join(__dirname, "..", "data", "products.json");
  fs.writeFileSync(outPath, JSON.stringify(products, null, 2));
  console.log(`Downloaded and adapted ${products.length} DummyJSON products -> ${outPath}`);
}

function adaptProduct(product) {
  const discount = Math.round(Number(product.discountPercentage || 0));
  const price = Math.max(1, Math.round(Number(product.price || 0) * INR_PER_USD));
  const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : price;
  const tags = unique([
    product.category,
    ...(product.tags || []),
    ...String(product.title || "").toLowerCase().split(/[^a-z0-9]+/),
  ]).filter(Boolean);

  return {
    id: Number(product.id),
    name: product.title,
    category: humanizeCategory(product.category),
    brand: product.brand || "Unbranded",
    price,
    originalPrice,
    discount,
    description: product.description || `${product.title} from the DummyJSON demo catalog.`,
    image: product.thumbnail || product.images?.[0] || "https://dummyjson.com/image/500x500/eeeeee/333333?text=Product",
    rating: Number(product.rating || 0),
    reviews: Array.isArray(product.reviews) ? product.reviews.length : Number(product.minimumOrderQuantity || 0),
    stock: Math.max(0, Number(product.stock || 0)),
    tags,
    attributes: compactAttributes(product),
    relatedProducts: [],
    source: "DummyJSON",
  };
}

function wireRelatedProducts(products) {
  const byCategory = new Map();
  for (const product of products) {
    const list = byCategory.get(product.category) || [];
    list.push(product);
    byCategory.set(product.category, list);
  }

  for (const product of products) {
    const sameCategory = (byCategory.get(product.category) || []).filter((item) => item.id !== product.id);
    const complementary = products.filter((item) => {
      if (item.id === product.id || item.category === product.category) return false;
      return product.tags.some((tag) => item.tags.includes(tag));
    });
    product.relatedProducts = unique([...sameCategory, ...complementary])
      .filter((item) => item.stock > 0)
      .slice(0, 4)
      .map((item) => item.id);
  }
}

function compactAttributes(product) {
  return Object.fromEntries(
    Object.entries({
      sku: product.sku,
      weight: product.weight ? `${product.weight} kg` : undefined,
      dimensions: product.dimensions ? `${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth}` : undefined,
      warranty: product.warrantyInformation,
      shipping: product.shippingInformation,
      availability: product.availabilityStatus,
      minimumOrderQuantity: product.minimumOrderQuantity,
    }).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function humanizeCategory(category) {
  return String(category || "Other")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function unique(items) {
  return [...new Set(items)];
}

main().catch((error) => {
  console.error(`Could not seed DummyJSON products: ${error.message}`);
  process.exitCode = 1;
});
