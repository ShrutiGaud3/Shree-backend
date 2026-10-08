import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// GET /api/admin/analytics?days=14 — read-only rollups for charts.
// Paid orders only (payment.status === "paid"), matching getDashboard.
const getAnalytics = async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 14));
  // UTC-midnight bucketing (matches $dateToString below, which is UTC)
  const now = new Date();
  const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const since = new Date(utcToday - (days - 1) * 86400000);

  const paidFilter = { "payment.status": "paid", createdAt: { $gte: since } };

  const [byDay, byCategory, topItems, recentOrders] = await Promise.all([
    Order.aggregate([
      { $match: paidFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productSnapshot.category",
          revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.qty"] } },
          units: { $sum: "$items.qty" },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          units: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.qty"] } },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 8 },
    ]),
    Order.find({})
      .populate("user", "name email")
      .select("status totalAmount payment.method createdAt items user")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  // Zero-fill every day in range so charts never gap
  const series = [];
  for (let i = 0; i < days; i += 1) {
    const key = new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10);
    const found = byDay.find((r) => r._id === key);
    series.push({ date: key, revenue: found?.revenue || 0, orders: found?.orders || 0 });
  }

  // Attach product names/images to top items (best-effort; deleted products keep ids)
  const ids = topItems.map((t) => t._id).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } })
    .select("name sku images price")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const topProducts = topItems.map((t) => ({
    productId: t._id,
    units: t.units,
    revenue: t.revenue,
    name: byId.get(String(t._id))?.name || "Removed product",
    sku: byId.get(String(t._id))?.sku || "",
    image: byId.get(String(t._id))?.images?.[0]?.url || "",
  }));

  res.status(200).json({
    days,
    salesSeries: series,
    categoryPie: (byCategory || []).map((c) => ({
      category: c._id || "unknown",
      revenue: c.revenue,
      units: c.units,
    })),
    topProducts,
    recentOrders: (recentOrders || []).map((o) => ({
      _id: o._id,
      status: o.status,
      totalAmount: o.totalAmount,
      paymentMethod: o.payment?.method,
      createdAt: o.createdAt,
      itemCount: (o.items || []).reduce((s, i) => s + (i.qty || 0), 0),
      user: o.user ? { name: o.user.name, email: o.user.email } : null,
    })),
  });
};

const analyticsController = { getAnalytics };

export default analyticsController;
