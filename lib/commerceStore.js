import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "commerce-store.json");
const EMPTY_STORE = { orders: [], activity: [], paymentEvents: [] };

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      activity: Array.isArray(parsed.activity) ? parsed.activity : [],
      paymentEvents: Array.isArray(parsed.paymentEvents) ? parsed.paymentEvents : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") return { ...EMPTY_STORE };
    throw error;
  }
}

async function saveStore(store) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function createOrderRecord(order) {
  const store = await readStore();
  const existingIndex = store.orders.findIndex((item) => item.orderId === order.orderId);
  if (existingIndex >= 0) store.orders[existingIndex] = { ...store.orders[existingIndex], ...order };
  else store.orders.unshift(order);
  await saveStore(store);
  return order;
}

export async function getOrderRecord(orderId) {
  const store = await readStore();
  return store.orders.find((order) => order.orderId === orderId) || null;
}

export async function updateOrderRecord(orderId, changes) {
  const store = await readStore();
  const index = store.orders.findIndex((order) => order.orderId === orderId);
  if (index < 0) return null;
  store.orders[index] = { ...store.orders[index], ...changes, updatedAt: new Date().toISOString() };
  await saveStore(store);
  return store.orders[index];
}

export async function listOrderRecords() {
  const store = await readStore();
  return store.orders;
}

export async function recordAgentActivity(entry) {
  const store = await readStore();
  const activity = {
    id: `AI_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    revenueImpact: 0,
    ...entry,
  };
  store.activity.unshift(activity);
  store.activity = store.activity.slice(0, 500);
  await saveStore(store);
  return activity;
}

export async function listAgentActivity() {
  const store = await readStore();
  return store.activity;
}

export async function recordPaymentEvent(eventId) {
  if (!eventId) return true;
  const store = await readStore();
  if (store.paymentEvents.includes(eventId)) return false;
  store.paymentEvents.unshift(eventId);
  store.paymentEvents = store.paymentEvents.slice(0, 500);
  await saveStore(store);
  return true;
}
