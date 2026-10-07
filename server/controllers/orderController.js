import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
import Order from "../models/orderModel.js";
import { STORE_NAME, STORE_CONFIG } from "../config/storeConfig.js";
import { reserveStock } from "../utils/stock.js";
import { cancelOrderAndRelease } from "../utils/orderService.js";
import { assertCouponUsable } from "../utils/coupon.js";
import { notifyOrderStatus } from "../utils/orderEmails.js";
import { createRazorpayOrder, isRazorpayConfigured } from "../utils/razorpay.js";

// Checkout: totals always computed from DB prices (never trust frontend).
// Stock is reserved atomically BEFORE the order is created; any failure
// rolls back already-reserved lines (see utils/stock.js).
// - COD: order placed immediately.
// - Razorpay: order placed (pending) + Razorpay order created; client pays
//   via checkout.js, then POST /api/payments/verify. Unpaid orders are
//   auto-cancelled by the stale-order job (utils/staleOrders.js).

const getMyOrders = async (req, res) => {
  const userId = req.user._id;
  const myOrders = await Order.find({ user: userId })
    .populate("items.product")
    .populate("coupon")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(myOrders || []);
};

const getMyOrder = async (req, res) => {
  // Ownership enforced: user can only fetch own orders (admin uses /api/admin/orders).
  const myOrder = await Order.findOne({ _id: req.params.oid, user: req.user._id })
    .populate("items.product")
    .populate("coupon")
    .lean();

  if (!myOrder) {
    res.status(404);
    throw new Error("Order Not Found!");
  }

  res.status(200).json(myOrder);
};

const buildItemsFromCart = (cart) => {
  let subtotal = 0;
  const items = cart.items.map((item) => {
    const p = item.product;
    if (!p || !p.isActive) {
      throw Object.assign(new Error("One of the products is unavailable"), { statusCode: 400 });
    }
    const unitPrice = item.variant?.price || p.price;
    subtotal += unitPrice * item.qty;
    const gstRate = p.gstRate ?? STORE_CONFIG.defaultGstRate;
    const taxableAmount = unitPrice * item.qty;
    const gstAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
    return {
      product: p._id,
      variant: item.variant || undefined,
      qty: item.qty,
      unitPrice,
      mrp: p.mrp,
      gstRate,
      gstAmount: gstAmount / item.qty,
      taxableAmount: taxableAmount / item.qty,
      productSnapshot: {
        name: p.name,
        images: p.images?.slice(0, 1) || [],
        category: p.category,
        subCategory: p.subCategory,
      },
    };
  });
  return { items, subtotal };
};

const createOrder = async (req, res) => {
  const userId = req.user._id;
  const { shippingAddress, couponCode, paymentMethod = "cod", customerNotes } = req.body;

  if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.pincode) {
    res.status(400);
    throw new Error("Shipping address with line1, city and pincode is required");
  }

  if (!["cod", "razorpay"].includes(paymentMethod)) {
    res.status(400);
    throw new Error("Invalid payment method");
  }

  if (paymentMethod === "razorpay" && !isRazorpayConfigured()) {
    res.status(503);
    throw new Error("Online payments are not configured. Please choose COD.");
  }

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    res.status(404);
    throw new Error("Cart is empty!");
  }

  const { items, subtotal } = buildItemsFromCart(cart);

  // Coupon (store-wide, incl. per-user limits)
  let coupon = null;
  let couponDiscount = 0;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    await assertCouponUsable(coupon, { orderValue: subtotal, userId });
    couponDiscount = coupon.calculateDiscount(subtotal);
  }

  const totalTaxable = subtotal - couponDiscount;
  const totalGst = items.reduce((s, i) => s + i.gstAmount * i.qty, 0);
  const shippingFee = totalTaxable >= STORE_CONFIG.freeShippingThreshold ? 0 : STORE_CONFIG.shippingFee;
  const totalAmount = Math.round((totalTaxable + totalGst + shippingFee) * 100) / 100;

  if (paymentMethod === "cod" && totalAmount > STORE_CONFIG.codMaxOrderValue) {
    res.status(400);
    throw new Error(`COD allowed only below ₹${STORE_CONFIG.codMaxOrderValue}. Please pay online.`);
  }

  // Atomic stock reserve (rolls back on any line failure)
  await reserveStock(items.map((i) => ({ product: i.product, variant: i.variant, qty: i.qty })));

  const order = new Order({
    user: userId,
    items,
    shippingAddress,
    subtotal,
    totalDiscount: couponDiscount,
    totalTaxable,
    totalGst,
    shippingFee,
    totalAmount,
    coupon: coupon?._id || undefined,
    couponCode: coupon?.code,
    couponDiscount,
    status: "placed",
    payment: { method: paymentMethod, status: "pending", amount: totalAmount, currency: "INR" },
    customerNotes,
  });

  try {
    if (paymentMethod === "razorpay") {
      const rzpOrder = await createRazorpayOrder({ amountInr: totalAmount, receipt: `shree_${Date.now()}` });
      order.payment.razorpayOrderId = rzpOrder.id;
    }

    await order.save();

    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }).exec();
    }
  } catch (error) {
    // Order could not be completed (e.g., Razorpay down) — give stock back.
    const { releaseStock } = await import("../utils/stock.js");
    await releaseStock(items.map((i) => ({ product: i.product, variant: i.variant, qty: i.qty })));
    throw error;
  }

  await order.populate("items.product");

  // Clear cart
  cart.items = [];
  await cart.save();

  // Brand-styled confirmation email (fire-and-forget; never fails checkout)
  notifyOrderStatus(order._id);

  if (paymentMethod === "razorpay") {
    return res.status(201).json({
      order,
      razorpay: {
        orderId: order.payment.razorpayOrderId,
        amount: totalAmount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        name: STORE_NAME,
      },
    });
  }

  res.status(201).json(order);
};

const cancelOrder = async (req, res) => {
  // Ownership enforced
  const order = await Order.findOne({ _id: req.params.oid, user: req.user._id });

  if (!order) {
    res.status(404);
    throw new Error("Order Not Found!");
  }

  // Shared lifecycle: release stock + refund if paid online
  await cancelOrderAndRelease(order, { by: req.user._id, reason: req.body?.reason || "" });

  // Brand-styled cancellation email (fire-and-forget)
  notifyOrderStatus(order._id);

  res.status(200).json(order);
};

const orderController = { getMyOrders, getMyOrder, createOrder, cancelOrder };

export default orderController;
