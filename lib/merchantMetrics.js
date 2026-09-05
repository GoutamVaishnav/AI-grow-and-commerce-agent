/**
 * All merchant KPIs are derived directly from the CONFIRMED orders
 * saved during checkout — nothing here is hardcoded or invented.
 */
export function computeMetrics(orders) {
  const confirmed = orders.filter((o) => o.status === "CONFIRMED");

  const totalRevenue = confirmed.reduce((sum, o) => sum + o.total, 0);
  const aiGeneratedRevenue = confirmed.reduce((sum, o) => sum + (o.aiGeneratedRevenue || 0), 0);
  const organicRevenue = totalRevenue - aiGeneratedRevenue;
  const orderCount = confirmed.length;
  const aiUpsellOrders = confirmed.filter((o) => (o.aiGeneratedRevenue || 0) > 0);
  const averageOrderValue = orderCount ? Math.round(totalRevenue / orderCount) : 0;
  const aiConversion = orderCount ? Number(((aiUpsellOrders.length / orderCount) * 100).toFixed(1)) : 0;

  return {
    totalRevenue,
    aiGeneratedRevenue,
    organicRevenue,
    orderCount,
    aiUpsells: aiUpsellOrders.length,
    averageOrderValue,
    aiConversion,
  };
}
