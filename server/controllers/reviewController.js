import Order from "../models/orderModel.js";
import Review from "../models/reviewModel.js";

const getReviews = async (req, res) => {
  const productId = req.pid || req.params.pid;
  const reviews = await Review.find({ product: productId, isApproved: true })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(reviews || []);
};

const addReview = async (req, res) => {
  const productId = req.pid || req.params.pid;
  const userId = req.user._id;
  const { rating, text, title } = req.body;

  if (!rating || !text) {
    res.status(400);
    throw new Error("Please fill all details!");
  }

  // Verified buyer check against new order schema (items[])
  const orderHistory = await Order.find({ user: userId, status: { $in: ["delivered", "completed"] } })
    .select("items")
    .lean();

  let purchasedBefore = false;
  let verifiedOrderId = null;
  for (const o of orderHistory || []) {
    for (const item of o.items || []) {
      if (item.product?.toString() === productId) {
        purchasedBefore = true;
        verifiedOrderId = o._id;
        break;
      }
    }
    if (purchasedBefore) break;
  }

  const review = await Review.create({
    user: userId,
    product: productId,
    order: verifiedOrderId || undefined,
    rating,
    text,
    title,
    isVerifiedBuyer: purchasedBefore || false,
  });

  res.status(201).json(review);
};

const removeReview = async (req, res) => {
  const reviewId = req.params.rid;
  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // Only owner or admin can delete (fixes missing authz)
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }
  if (!req.user.isAdmin && review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this review");
  }

  await Review.findByIdAndDelete(reviewId);
  res.status(200).json({ message: "Review Removed", _id: reviewId });
};

const reviewController = { getReviews, addReview, removeReview };

export default reviewController;
