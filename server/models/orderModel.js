import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      // If variant was purchased, store variant details here
      label: { type: String },
      sku: { type: String },
      attributes: { type: Map, of: String },
    },
    qty: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
      default: 1,
    },
    // Price at time of purchase
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      min: 0,
    },
    // Tax breakdown per item
    gstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    gstAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Discount per item (from coupon)
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Product snapshot for history
    productSnapshot: {
      name: { type: String },
      images: [{ url: String }],
      category: { type: String },
      subCategory: { type: String },
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cod", "razorpay"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },
    // Razorpay fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    // COD fields
    codConfirmed: { type: Boolean, default: false },
    // Refund fields
    refundId: { type: String },
    refundAmount: { type: Number, min: 0 },
    refundReason: { type: String },
    refundedAt: { type: Date },
    // Amounts
    amount: { type: Number, required: true, min: 0 }, // Amount paid/pending
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    // Order totals
    subtotal: { type: Number, required: true, min: 0 }, // Sum of (unitPrice * qty)
    totalDiscount: { type: Number, default: 0, min: 0 },
    totalTaxable: { type: Number, required: true, min: 0 }, // Subtotal - discount
    totalGst: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }, // Final amount payable
    // Coupon
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    // Status
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
        "rejected",
        "completed",
      ],
      default: "placed",
      index: true,
    },
    // Payment
    payment: {
      type: paymentSchema,
      required: true,
    },
    // Status history
    statusHistory: [statusHistorySchema],
    // Cancellation/Return
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    returnReason: { type: String },
    returnedAt: { type: Date },
    returnItems: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId },
        qty: { type: Number },
        reason: { type: String },
        status: {
          type: String,
          enum: ["requested", "approved", "rejected", "received", "refunded"],
          default: "requested",
        },
      },
    ],
    // Notes
    adminNotes: { type: String },
    customerNotes: { type: String },
    // Tracking
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.razorpayOrderId": 1 });
orderSchema.index({ "payment.razorpayPaymentId": 1 });

// Virtual: formatted order ID
orderSchema.virtual("orderId").get(function () {
  return this._id.toString().slice(-8).toUpperCase();
});

// Virtual: is cancellable
orderSchema.virtual("isCancellable").get(function () {
  return ["placed", "confirmed", "processing"].includes(this.status);
});

// Virtual: is returnable
orderSchema.virtual("isReturnable").get(function () {
  return ["delivered", "completed"].includes(this.status);
});

// Pre-save: add status to history
orderSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this._updatedBy || null,
    });
    // Set timestamps for specific statuses
    if (this.status === "shipped") this.shippedAt = new Date();
    if (this.status === "delivered") this.deliveredAt = new Date();
    if (this.status === "cancelled") this.cancelledAt = new Date();
    if (this.status === "returned") this.returnedAt = new Date();
  }
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      note: "Order placed",
    });
  }
  next();
});

// Method: calculate totals from items
orderSchema.methods.calculateTotals = function (shippingFee = 0, couponDiscount = 0) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  this.totalDiscount = couponDiscount;
  this.totalTaxable = this.subtotal - this.totalDiscount;
  this.totalGst = this.items.reduce((sum, item) => sum + item.gstAmount * item.qty, 0);
  this.shippingFee = shippingFee;
  this.totalAmount = this.totalTaxable + this.totalGst + this.shippingFee;
  return this;
};

// Ensure virtuals
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;