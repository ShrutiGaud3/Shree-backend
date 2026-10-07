// Shared order lifecycle: cancel + stock release + refund.
// Used by both the user cancel endpoint and the admin status transition,
// so the two paths can never drift apart.

import Coupon from "../models/couponModel.js";
import { releaseStock } from "./stock.js";
import { refundRazorpayPayment } from "./razorpay.js";
import logger from "./logger.js";

const CANCELLABLE = ["placed", "confirmed", "processing"];

// Throws with statusCode on invalid transition / refund failure.
// Refund (if paid online) is attempted BEFORE mutating the order, so a
// failed refund leaves the order untouched for retry.
export const cancelOrderAndRelease = async (order, { by = null, reason = "" } = {}) => {
  if (!order) {
    const err = new Error("Order Not Found!");
    err.statusCode = 404;
    throw err;
  }

  if (!CANCELLABLE.includes(order.status)) {
    const err = new Error("Order cannot be cancelled at this stage");
    err.statusCode = 409;
    throw err;
  }

  const paidOnline = order.payment?.method === "razorpay" && order.payment?.status === "paid";

  if (paidOnline) {
    try {
      const refund = await refundRazorpayPayment(order.payment.razorpayPaymentId, order.totalAmount);
      order.payment.status = "refunded";
      order.payment.refundId = refund.id;
      order.payment.refundAmount = order.totalAmount;
      order.payment.refundedAt = new Date();
    } catch (error) {
      logger.error({ orderId: order._id, err: error.message }, "Razorpay refund failed");
      const err = new Error("Could not process the refund. Order was NOT cancelled — please retry.");
      err.statusCode = 502;
      throw err;
    }
  }

  await releaseStock(order.items);

  if (order.coupon) {
    await Coupon.findOneAndUpdate(
      { _id: order.coupon, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } }
    ).exec();
  }

  if (by) order._updatedBy = by;
  order.status = "cancelled";
  order.cancelledAt = new Date();
  if (by) order.cancelledBy = by;
  if (reason) order.cancellationReason = reason;
  await order.save();

  return order;
};
