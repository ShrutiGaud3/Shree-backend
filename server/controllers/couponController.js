import Coupon from "../models/couponModel.js";
import { assertCouponUsable } from "../utils/coupon.js";

// Store-wide coupons (no shop scoping). Full usage-limit/per-user checks in Phase 5.

const getCoupons = async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({ isActive: true, startsAt: { $lte: now }, expiresAt: { $gte: now } })
    .select("code description discountType discountValue maxDiscount minOrderValue applicableCategory expiresAt")
    .lean();
  res.status(200).json(coupons || []);
};

const applyCoupon = async (req, res) => {
  const { couponCode, orderValue = 0 } = req.body;

  if (!couponCode) {
    res.status(400);
    throw new Error("Please send coupon code");
  }

  const couponExists = await Coupon.findOne({ code: couponCode.toUpperCase() });

  await assertCouponUsable(couponExists, { orderValue: Number(orderValue) || 0, userId: req.user._id });

  res.status(200).json({
    code: couponExists.code,
    discountType: couponExists.discountType,
    discountValue: couponExists.discountValue,
    maxDiscount: couponExists.maxDiscount,
    estimatedDiscount: couponExists.calculateDiscount(Number(orderValue) || 0),
  });
};

const couponController = { getCoupons, applyCoupon };

export default couponController;
