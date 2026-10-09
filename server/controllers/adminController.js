import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";
import { STORE_CONFIG } from "../config/storeConfig.js";
import { isValidSubCategory } from "../config/categories.js";
import { cancelOrderAndRelease } from "../utils/orderService.js";
import { notifyOrderStatus } from "../utils/orderEmails.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "../middleware/cloudinaryMiddleware.js";
import { clearProductCache } from "./productController.js";

// Single-vendor admin. Merged shop-owner functions (product + coupon + order updates).
// Full CRUD validation (zod) + Cloudinary wiring lands in Phase 2/3.

const getUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
  res.status(200).json(users || []);
};

const updateUser = async (req, res) => {
  const { isBlocked, isActive, isAdmin } = req.body;
  const update = {};
  if (typeof isBlocked === "boolean") update.isBlocked = isBlocked;
  if (typeof isActive === "boolean") update.isActive = isActive;
  if (typeof isAdmin === "boolean") update.isAdmin = isAdmin;

  if (Object.keys(update).length === 0) {
    res.status(400);
    throw new Error("Provide isBlocked, isActive or isAdmin to update");
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.uid, update, { new: true }).select("-password");

  if (!updatedUser) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(updatedUser);
};

const getAllOrders = async (req, res) => {
  const allOrders = await Order.find()
    .populate("user", "name email phone")
    .populate("items.product", "name price sku")
    .populate("coupon", "code")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(allOrders || []);
};

const updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  if (!status) {
    res.status(400);
    throw new Error("Status is required");
  }

  const order = await Order.findById(req.params.oid);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const allowed = STORE_CONFIG.orderStatusTransitions[order.status] || [];
  if (!allowed.includes(status)) {
    res.status(409);
    throw new Error(`Cannot transition order from "${order.status}" to "${status}"`);
  }

  // Cancel goes through the shared lifecycle (stock release + refund if paid)
  if (status === "cancelled") {
    await cancelOrderAndRelease(order, { by: req.user._id, reason: note || "Cancelled by admin" });
    notifyOrderStatus(order._id);
    return res.status(200).json(order);
  }

  order._updatedBy = req.user._id;
  order.status = status;
  if (note) order.adminNotes = note;

  // COD is collected on delivery — mark cash received
  if (status === "delivered" && order.payment?.method === "cod" && order.payment?.status === "pending") {
    order.payment.status = "paid";
  }

  await order.save();
  notifyOrderStatus(order._id);

  res.status(200).json(order);
};

// --- Product admin (Cloudinary upload via memory storage; soft delete) ---
const getProductsAdmin = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  res.status(200).json(products || []);
};

const uploadProductFiles = async (files = [], alt = "") => {
  if (!files || !files.length) return [];

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const hasCloudinary = Boolean(cloudName && apiKey && apiSecret);

  if (!hasCloudinary) {
    // Graceful fallback to data URI when Cloudinary is not configured
    return files.map((f, i) => ({
      url: `data:${f.mimetype || "image/jpeg"};base64,${f.buffer.toString("base64")}`,
      publicId: `local_${Date.now()}_${i}`,
      alt: alt || "Product image",
      isPrimary: i === 0,
    }));
  }

  try {
    const uploads = await Promise.all(
      files.map((f) => uploadToCloudinary(f.buffer, { folder: "shree/products" }))
    );
    return uploads.map((u, i) => ({
      url: u.secure_url,
      publicId: u.public_id,
      alt: alt || "Product image",
      isPrimary: i === 0,
    }));
  } catch (err) {
    console.warn("Cloudinary upload failed, falling back to data URL:", err.message);
    return files.map((f, i) => ({
      url: `data:${f.mimetype || "image/jpeg"};base64,${f.buffer.toString("base64")}`,
      publicId: `local_${Date.now()}_${i}`,
      alt: alt || "Product image",
      isPrimary: i === 0,
    }));
  }
};

const createProduct = async (req, res) => {
  const { images: _ignored, ...data } = req.body;
  const images = await uploadProductFiles(req.files || [], data.name || "");
  const product = await Product.create({ ...data, images });
  clearProductCache();
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const { images: _ignored, removeImages, ...updates } = req.body;

  const product = await Product.findById(req.params.pid);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Keep category/subCategory pair valid when either side changes
  const nextCategory = updates.category || product.category;
  const nextSubCategory = updates.subCategory || product.subCategory;
  if (!isValidSubCategory(nextCategory, nextSubCategory)) {
    res.status(400);
    throw new Error(`Invalid subCategory "${nextSubCategory}" for category "${nextCategory}"`);
  }

  // Variant SKUs must stay unique (model hook only runs on save/create paths)
  const nextVariants = updates.variants || product.variants || [];
  const skus = nextVariants.map((v) => v.sku).filter(Boolean);
  if (skus.length !== new Set(skus).size) {
    res.status(400);
    throw new Error("Variant SKUs must be unique");
  }

  // Append newly uploaded images
  if (req.files?.length) {
    const fresh = await uploadProductFiles(req.files, updates.name || product.name);
    product.images.push(...fresh);
  }

  // Remove images (accepts publicIds or full URLs) from Cloudinary + doc
  if (removeImages) {
    const list = Array.isArray(removeImages) ? removeImages : [removeImages];
    if (list.length) {
      const ids = list.map((r) => (typeof r === "string" && r.includes("http") ? getPublicIdFromUrl(r) : r)).filter(Boolean);
      await Promise.allSettled(ids.map((id) => deleteFromCloudinary(id)));
      product.images = product.images.filter(
        (img) => !ids.includes(img.publicId) && !ids.includes(img.url) && !list.includes(img.url) && !list.includes(img.publicId)
      );
    }
  }

  Object.assign(product, updates);

  // Keep exactly one primary image when images exist
  if (product.images?.length && !product.images.some((img) => img.isPrimary)) {
    product.images[0].isPrimary = true;
  }

  await product.save(); // runs validators + pre-save hooks
  clearProductCache();
  res.status(200).json(product);
};

const deleteProduct = async (req, res) => {
  // Soft delete (keeps order history intact; re-activate via PUT isActive:true)
  const updated = await Product.findByIdAndUpdate(req.params.pid, { isActive: false }, { new: true });
  if (!updated) {
    res.status(404);
    throw new Error("Product not found");
  }
  clearProductCache();
  res.status(200).json({ message: "Product deactivated", _id: updated._id });
};

// --- Admin dashboard ---
const LOW_STOCK_THRESHOLD = 5;

const getDashboard = async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Revenue counts only collected money (prepaid + COD-on-delivery)
  const paidFilter = { "payment.status": "paid" };
  const revenueSum = (rows) => rows.reduce((s, r) => s + (r.total || 0), 0);

  const [
    todayOrders,
    todayRevenueRows,
    totalRevenueRows,
    totalOrders,
    totalUsers,
    activeProducts,
    ordersByStatus,
    lowStock,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: paidFilter },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({}),
    User.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Product.find({
      isActive: true,
      $or: [{ stock: { $lte: LOW_STOCK_THRESHOLD } }, { "variants.stock": { $lte: LOW_STOCK_THRESHOLD } }],
    })
      .select("name sku category subCategory stock variants.price variants.stock images")
      .limit(20)
      .lean(),
  ]);

  res.status(200).json({
    today: { orders: todayOrders, revenue: revenueSum(todayRevenueRows) },
    totals: {
      revenue: revenueSum(totalRevenueRows),
      orders: totalOrders,
      users: totalUsers,
      activeProducts,
    },
    ordersByStatus: Object.fromEntries((ordersByStatus || []).map((r) => [r._id, r.count])),
    lowStock: lowStock || [],
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  });
};

// --- Coupon admin (full rules in Phase 5) ---
const getCouponsAdmin = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.status(200).json(coupons || []);
};

const createCoupon = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error("Coupon code is required");
  }
  const coupon = await Coupon.create({ ...req.body, code: code.toUpperCase() });
  res.status(201).json(coupon);
};

const updateCoupon = async (req, res) => {
  if (req.body.code) req.body.code = req.body.code.toUpperCase();
  const updated = await Coupon.findByIdAndUpdate(req.params.cid, req.body, { new: true, runValidators: true });
  if (!updated) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  res.status(200).json(updated);
};

const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.cid);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  // Hard-delete only unused coupons; otherwise deactivate to keep history intact
  if (coupon.usedCount > 0) {
    coupon.isActive = false;
    await coupon.save();
    return res.status(200).json({ message: "Coupon has redemptions, deactivated instead", _id: coupon._id });
  }
  await coupon.deleteOne();
  res.status(200).json({ message: "Coupon deleted", _id: req.params.cid });
};

const adminControllers = {
  getDashboard,
  getUsers,
  updateUser,
  getAllOrders,
  updateOrderStatus,
  getProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  getCouponsAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};

export default adminControllers;
