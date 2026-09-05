export const ORDERS_STORAGE_KEY = "shopagent_orders";

export const ORDER_STATES = {
  CART: "CART",
  CHECKOUT: "CHECKOUT",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  CONFIRMED: "CONFIRMED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
};

export function readOrders() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeOrders(orders) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function saveOrder(order) {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.orderId === order.orderId);
  if (idx >= 0) {
    orders[idx] = order;
  } else {
    orders.unshift(order);
  }
  writeOrders(orders);
  return order;
}

export function generateOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ORD${Date.now().toString().slice(-6)}${n}`;
}

export function buildOrder({ cartResult, address, paymentMode }) {
  return {
    orderId: generateOrderId(),
    status: ORDER_STATES.PAYMENT_PENDING,
    createdAt: new Date().toISOString(),
    address,
    paymentMode,
    lines: cartResult.lines,
    subtotal: cartResult.subtotal,
    organicRevenue: cartResult.organicTotal,
    aiGeneratedRevenue: cartResult.aiGeneratedRevenue,
    total: cartResult.total,
  };
}
