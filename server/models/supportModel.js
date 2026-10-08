import mongoose from "mongoose";

// Contact-form messages (public write, admin inbox read/update).
const supportMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "read", "replied", "closed"],
      default: "new",
      index: true,
    },
    adminReply: {
      text: { type: String, trim: true, maxlength: 2000 },
      repliedAt: { type: Date },
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true }
);

supportMessageSchema.index({ status: 1, createdAt: -1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);

export default SupportMessage;
