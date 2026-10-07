import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    // Discount type
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
      required: true,
    },
    // Discount value
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    // Maximum discount cap (for percentage discounts)
    maxDiscount: {
      type: Number,
      min: [0, "Max discount cannot be negative"],
    },
    // Minimum order value to apply
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, "Min order value cannot be negative"],
    },
    // Category restriction (optional)
    applicableCategory: {
      type: String,
      enum: ["toys", "jewellery", "all"],
      default: "all",
    },
    // Usage limits
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
      min: [0, "Usage limit cannot be negative"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    // Per user limit
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, "Per user limit must be at least 1"],
    },
    // Validity
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (unique:true on code already creates single-field index)
couponSchema.index({ isActive: 1, expiresAt: 1 });
couponSchema.index({ code: 1, isActive: 1 });

// Virtual: is valid (active and not expired)
couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  return this.isActive && now >= this.startsAt && now <= this.expiresAt;
});

// Virtual: remaining uses
couponSchema.virtual("remainingUses").get(function () {
  if (this.usageLimit === 0) return Infinity;
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Method: check if coupon can be applied
couponSchema.methods.canApply = function (orderValue, category, userId) {
  const now = new Date();

  if (!this.isActive) return { valid: false, reason: "Coupon is inactive" };
  if (now < this.startsAt) return { valid: false, reason: "Coupon not yet active" };
  if (now > this.expiresAt) return { valid: false, reason: "Coupon has expired" };
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit)
    return { valid: false, reason: "Coupon usage limit reached" };
  if (orderValue < this.minOrderValue)
    return { valid: false, reason: `Minimum order value of ₹${this.minOrderValue} required` };
  if (this.applicableCategory !== "all" && this.applicableCategory !== category)
    return { valid: false, reason: `Coupon valid only for ${this.applicableCategory}` };

  // Check per-user limit (would need to query Order collection)
  // This is checked in the controller

  return { valid: true };
};

// Method: calculate discount amount
couponSchema.methods.calculateDiscount = function (taxableAmount) {
  let discount = 0;
  if (this.discountType === "percentage") {
    discount = (taxableAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }
  // Discount cannot exceed taxable amount
  return Math.min(discount, taxableAmount);
};

// Ensure virtuals
couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;