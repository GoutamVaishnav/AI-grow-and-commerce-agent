export const AI_ACTIVITY_KEY = "shopagent_ai_activity";

/**
 * Every bounded AI action (see agent/tools.js ALLOWED_ACTIONS) gets
 * logged here with action / reason / input / result / revenue impact /
 * timestamp / status — this is what powers the /merchant/ai-activity
 * audit trail and the AI-generated-revenue KPI.
 */
export function readActivity() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AI_ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logActivity(entry) {
  if (typeof window === "undefined") return;
  const activity = readActivity();
  activity.unshift({
    id: `AI_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    revenueImpact: 0,
    ...entry,
  });
  window.localStorage.setItem(AI_ACTIVITY_KEY, JSON.stringify(activity.slice(0, 200)));
  window.dispatchEvent(new Event("ai-activity-updated"));
}
