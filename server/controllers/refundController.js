import Order from "../models/orderModel.js";
import { isRazorpayConfigured, refundRazorpayPayment } from "../utils/razorpay.js";
import { notifyOrderStatus } from "../utils/orderEmails.js";

// Admin-initiated refund (new path; cancel-flow refunds untouched).
// Only prepaid Razorpay orders with captured payment; COD has no online money.
const refundOrder = async (req, res) => {
  const order = await Order.findById(req.params.oid);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.payment?.method !== "razorpay") {
    res.status(409);
    throw new Error("Only prepaid online orders can be refunded here");
  }
  if (!order.payment?.razorpayPaymentId) {
    res.status(409);
    throw new Error("No captured payment found for this order");
  }
  if (order.payment?.status === "refunded") {
    res.status(409);
    throw new Error("Order is already fully refunded");
  }
  if (!["delivered", "returned", "completed"].includes(order.status)) {
    res.status(409);
    throw new Error(`Refunds allowed only for delivered/returned/completed orders (current: ${order.status})`);
  }
  if (!isRazorpayConfigured()) {
    res.status(503);
    throw new Error("Payment gateway is not configured");
  }

  const amount = req.body.amount !== undefined ? Number(req.body.amount) : order.totalAmount;
  if (!Number.isFinite(amount) || amount <= 0 || amount > order.totalAmount) {
    res.status(400);
    throw new Error(`Refund amount must be between 1 and ${order.totalAmount}`);
  }

  const refund = await refundRazorpayPayment(order.payment.razorpayPaymentId, amount);

  const isFull = amount >= order.totalAmount;
  order.payment.status = isFull ? "refunded" : "partially_refunded";
  order.payment.refundId = refund?.id;
  order.payment.refundAmount = amount;
  order.payment.refundReason = (req.body.reason || "Refunded by admin").slice(0, 500);
  order.payment.refundedAt = new Date();
  if (isFull) {
    order._updatedBy = req.user._id;
    order.status = "refunded";
  }
  if (req.body.reason) order.adminNotes = String(req.body.reason).slice(0, 500);
  await order.save();
  notifyOrderStatus(order._id);

  res.status(200).json(order);
};

const refundController = { refundOrder };

export default refundController;
