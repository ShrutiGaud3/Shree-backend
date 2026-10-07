import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      // Required for verified buyer reviews
    },
    rating: {
      type: Number,
      min: [1, "Rating cannot be less than 1"],
      max: [5, "Rating cannot be greater than 5"],
      required: true,
    },
    title: {
      type: String,
      maxlength: [100, "Title cannot exceed 100 characters"],
      trim: true,
    },
    text: {
      type: String,
      required: [true, "Review text is required"],
      maxlength: [2000, "Review cannot exceed 2000 characters"],
      trim: true,
    },
    images: [{ type: String }], // Review images (optional)
    isVerifiedBuyer: {
      type: Boolean,
      default: false,
    },
    // Admin moderation
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve for now
    },
    adminResponse: {
      text: { type: String },
      respondedAt: { type: Date },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reportedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Virtual: has images
reviewSchema.virtual("hasImages").get(function () {
  return this.images && this.images.length > 0;
});

// Ensure virtuals
reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;