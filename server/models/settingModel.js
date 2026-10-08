import mongoose from "mongoose";

// Key-value store overrides for static STORE_CONFIG (numbers + notice only).
// Reads fall back to static defaults, so behaviour is identical until an
// admin saves an override.
const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: { type: mongoose.Schema.Types.Mixed },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
