import mongoose from "mongoose";

// Newsletter subscribers (double opt-in not required for this store;
// unsubscribe is a soft flag so history is kept).
const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    source: { type: String, trim: true, maxlength: 30, default: "footer" },
  },
  { timestamps: true }
);

const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSchema);

export default NewsletterSubscriber;
