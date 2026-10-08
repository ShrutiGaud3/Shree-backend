import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import NewsletterSubscriber from "../models/newsletterModel.js";

// CSV cell escaping (quotes, commas, newlines)
const cell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (headers, rows) => [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

const parseRange = (query) => {
  const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : new Date();
  const from = query.from
    ? new Date(`${query.from}T00:00:00.000Z`)
    : new Date(to.getTime() - 30 * 86400000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    const err = new Error("Invalid from/to date range (use YYYY-MM-DD)");
    err.statusCode = 400;
    throw err;
  }
  return { from, to };
};

const sendCsv = (res, name, text) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  res.status(200).send(`\uFEFF${text}`);
};

const salesReport = async (from, to) => {
  const rows = await Order.aggregate([
    { $match: { "payment.status": "paid", createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return csv(["date", "orders", "revenue_inr"], (rows || []).map((r) => [r._id, r.orders, r.revenue]));
};

const ordersReport = async (from, to) => {
  const orders = await Order.find({ createdAt: { $gte: from, $lte: to } })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(2000)
    .lean();
  return csv(
    ["order_id", "date", "customer", "email", "items", "total_inr", "payment", "pay_status", "status"],
    (orders || []).map((o) => [
      `SHREE-${String(o._id).slice(-8).toUpperCase()}`,
      new Date(o.createdAt).toISOString(),
      o.user?.name || "",
      o.user?.email || "",
      (o.items || []).reduce((s, i) => s + (i.qty || 0), 0),
      o.totalAmount,
      o.payment?.method || "",
      o.payment?.status || "",
      o.status,
    ])
  );
};

const inventoryReport = async () => {
  const products = await Product.find({}).select("sku name category subCategory price stock variants").lean();
  return csv(
    ["sku", "name", "category", "sub_category", "price_inr", "stock_units", "stock_value_inr"],
    (products || []).map((p) => {
      const units = p.variants?.length
        ? p.variants.reduce((s, v) => s + (v.stock || 0), 0)
        : p.stock ?? 0;
      return [p.sku, p.name, p.category, p.subCategory, p.price, units, (p.price || 0) * units];
    })
  );
};

const customersReport = async (from, to) => {
  const users = await User.find({ createdAt: { $gte: from, $lte: to } }).select("name email phone isAdmin createdAt").lean();
  const spend = await Order.aggregate([
    { $match: { "payment.status": "paid" } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$totalAmount" } } },
  ]);
  const byUser = new Map((spend || []).map((s) => [String(s._id), s]));
  return csv(
    ["name", "email", "phone", "orders", "spent_inr", "is_admin", "joined"],
    (users || []).map((u) => {
      const s = byUser.get(String(u._id)) || { orders: 0, spent: 0 };
      return [u.name, u.email, u.phone, s.orders, s.spent, u.isAdmin ? "yes" : "no", new Date(u.createdAt).toISOString()];
    })
  );
};

const newsletterReport = async () => {
  const subs = await NewsletterSubscriber.find({}).sort({ createdAt: -1 }).lean();
  return csv(
    ["email", "active", "source", "subscribed_on"],
    (subs || []).map((s) => [s.email, s.isActive ? "yes" : "no", s.source, new Date(s.createdAt).toISOString()])
  );
};

const BUILDERS = { sales: salesReport, orders: ordersReport, inventory: inventoryReport, customers: customersReport, newsletter: newsletterReport };

// GET /api/admin/reports/:type?from=YYYY-MM-DD&to=YYYY-MM-DD
const downloadReport = async (req, res) => {
  const builder = BUILDERS[req.params.type];
  if (!builder) {
    res.status(404);
    throw new Error("Unknown report type");
  }
  const { from, to } = parseRange(req.query);
  const text = await builder(from, to);
  const stamp = new Date().toISOString().slice(0, 10);
  sendCsv(res, `shree-${req.params.type}-${stamp}.csv`, text);
};

const reportsController = { downloadReport };

export default reportsController;
