import Review from "../models/reviewModel.js";

// Admin moderation (public listing already filters isApproved:true —
// hiding here takes effect instantly with no other changes).
const getReviewsAdmin = async (req, res) => {
  const filter = {};
  if (req.query.approved === "true") filter.isApproved = true;
  else if (req.query.approved === "false") filter.isApproved = false;
  if (req.query.reported === "true") filter.reportedCount = { $gt: 0 };

  const reviews = await Review.find(filter)
    .populate("user", "name email")
    .populate("product", "name slug images")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.status(200).json(reviews || []);
};

const moderateReview = async (req, res) => {
  const updated = await Review.findByIdAndUpdate(
    req.params.rid,
    { $set: { isApproved: req.body.isApproved } },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) {
    res.status(404);
    throw new Error("Review not found");
  }
  res.status(200).json(updated);
};

const replyReview = async (req, res) => {
  const updated = await Review.findByIdAndUpdate(
    req.params.rid,
    {
      $set: {
        adminResponse: { text: req.body.text, respondedAt: new Date(), respondedBy: req.user._id },
      },
    },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) {
    res.status(404);
    throw new Error("Review not found");
  }
  res.status(200).json(updated);
};

const deleteReviewAdmin = async (req, res) => {
  const deleted = await Review.findByIdAndDelete(req.params.rid);
  if (!deleted) {
    res.status(404);
    throw new Error("Review not found");
  }
  res.status(200).json({ message: "Review deleted", _id: req.params.rid });
};

const reviewAdminController = { getReviewsAdmin, moderateReview, replyReview, deleteReviewAdmin };

export default reviewAdminController;
