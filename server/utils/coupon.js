// Coupon usability checks shared by apply + checkout.
// Model.canApply covers expiry/status/limits/category; per-user limits need
// order history, which lives here (not in the model).

import Order from "../models/orderModel.js";

export const assertCouponUsable = async (coupon, { orderValue = 0, userId = null } = {}) => {
  if (!coupon) {
    const err = new Error("Invalid Coupon");
    err.statusCode = 404;
    throw err;
  }

  const check = coupon.canApply(Number(orderValue) || 0);
  if (!check.valid) {
    const err = new Error(check.reason);
    err.statusCode = 400;
    throw err;
  }

  if (userId && coupon.perUserLimit > 0) {
    const used = await Order.countDocuments({
      user: userId,
      coupon: coupon._id,
      status: { $ne: "cancelled" },
    });
    if (used >= coupon.perUserLimit) {
      const err = new Error("You have already used this coupon the maximum number of times");
      err.statusCode = 400;
      throw err;
    }
  }

  return true;
};
