import mongoose from "mongoose";

// Generic homepage/marketing blocks. One collection serves every CMS section
// (announcement bar, offer countdown, testimonials, gallery) — only the
// fields relevant to a section are filled; everything is optional except
// section. Frontend renders whatever is active + date-valid.
const cmsBlockSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: [true, "Section is required"],
      enum: ["announcement", "offer", "testimonial", "gallery"],
      index: true,
    },
    title: { type: String, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 200 },
    content: { type: String, trim: true, maxlength: 2000 },
    name: { type: String, trim: true, maxlength: 60 },
    rating: { type: Number, min: 1, max: 5 },
    image: { type: String, trim: true, maxlength: 500 },
    link: { type: String, trim: true, maxlength: 500 },
    linkLabel: { type: String, trim: true, maxlength: 40 },
    endsAt: { type: Date },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cmsBlockSchema.index({ section: 1, isActive: 1 });
cmsBlockSchema.index({ sortOrder: 1 });

const CmsBlock = mongoose.model("CmsBlock", cmsBlockSchema);

export default CmsBlock;
