/**
 * The /api/agent/* endpoints simulate an EXTERNAL AI buyer hitting the
 * store over HTTP (no browser, no localStorage). For the hackathon demo
 * we keep their carts in a simple in-memory map keyed by sessionId,
 * which resets on server restart — deliberately simple, matching the
 * "no database" constraint.
 */
const sessions = globalThis.__shopagentSessions || (globalThis.__shopagentSessions = new Map());

export function getSessionCart(sessionId) {
  return sessions.get(sessionId) || [];
}

export function setSessionCart(sessionId, cartItems) {
  sessions.set(sessionId, cartItems);
  return cartItems;
}
