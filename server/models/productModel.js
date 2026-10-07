import mongoose from "mongoose";
import { TOP_LEVEL_CATEGORIES, ALL_SUB_CATEGORIES, isValidSubCategory } from "../config/categories.js";

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g., "Size: M, Color: Red"
    sku: { type: String, required: true, unique: true, sparse: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }], // Variant-specific images (optional)
    attributes: {
      type: Map,
      of: String,
    }, // e.g., { size: "M", color: "Red" }
  },
  { _id: false }
);

// Toys-specific fields schema
const toysFieldsSchema = new mongoose.Schema(
  {
    ageGroup: {
      type: String,
      enum: ["0-3", "3-6", "6-12", "12+"],
    },
    safetyCertifications: [{ type: String }], // e.g., ["BIS", "ISI", "EN71"]
    batteryRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

// Jewellery-specific fields schema
const jewelleryFieldsSchema = new mongoose.Schema(
  {
    material: {
      type: String,
      enum: ["gold-plated", "silver-925", "artificial", "platinum-plated", "rose-gold-plated", "brass", "copper"],
    },
    purity: { type: String }, // e.g., "22K", "925", "18K"
    stoneType: { type: String }, // e.g., "Cubic Zirconia", "American Diamond", "Pearl", "None"
    weightGrams: { type: Number, min: 0 },
    hallmarkNumber: { type: String },
    careInstructions: { type: String },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public_id (for deletion)
        alt: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: TOP_LEVEL_CATEGORIES,
        message: "Category must be either 'toys' or 'jewellery'",
      },
      index: true,
    },
    subCategory: {
      type: String,
      required: [true, "Sub-category is required"],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, "Brand cannot exceed 50 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    tags: [{ type: String, trim: true }],
    mrp: {
      type: Number,
      required: [true, "MRP is required"],
      min: [0, "MRP cannot be negative"],
    },
    price: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    // Variants for size/color variations
    variants: [variantSchema],
    // Category-specific fields (validated at application level)
    toysFields: toysFieldsSchema,
    jewelleryFields: jewelleryFieldsSchema,
    // Tax
    gstRate: {
      type: Number,
      default: 18,
      min: [0, "GST rate cannot be negative"],
      max: [100, "GST rate cannot exceed 100%"],
    },
    // Return policy
    isReturnable: {
      type: Boolean,
      default: true,
    },
    // SEO
    metaTitle: { type: String, maxlength: [60, "Meta title cannot exceed 60 characters"] },
    metaDescription: { type: String, maxlength: [160, "Meta description cannot exceed 160 characters"] },
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Ratings (denormalized for performance)
    ratingAvg: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: [0, "Rating count cannot be negative"],
    },
    // Sales tracking
    soldCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ name: "text", description: "text", tags: "text", brand: "text" });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ ratingAvg: -1 });
productSchema.index({ isActive: 1, category: 1, subCategory: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Pre-validate: generate slug from name if not provided.
// (Must be pre-validate, not pre-save: insertMany skips save hooks,
// which would leave slug null and trip the unique index.)
productSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-"
      + Date.now().toString(36);
  }
  next();
});

// Pre-save: validate category-specific fields
productSchema.pre("validate", function (next) {
  // If category is toys, jewelleryFields should be empty
  if (this.category === "toys" && this.jewelleryFields) {
    const hasJewelleryData = Object.keys(this.jewelleryFields.toObject()).some(
      (k) => this.jewelleryFields[k] !== undefined && this.jewelleryFields[k] !== null && this.jewelleryFields[k] !== ""
    );
    if (hasJewelleryData) {
      return next(new Error("Jewellery fields cannot be set for toys category"));
    }
  }

  // If category is jewellery, toysFields should be empty
  if (this.category === "jewellery" && this.toysFields) {
    const hasToysData = Object.keys(this.toysFields.toObject()).some(
      (k) => this.toysFields[k] !== undefined && this.toysFields[k] !== null && this.toysFields[k] !== ""
    );
    if (hasToysData) {
      return next(new Error("Toys fields cannot be set for jewellery category"));
    }
  }

  // Validate subCategory belongs to category
  if (this.category && this.subCategory && !isValidSubCategory(this.category, this.subCategory)) {
    return next(new Error(`Invalid subCategory "${this.subCategory}" for category "${this.category}"`));
  }

  // If variants exist, product-level stock is not used for inventory
  if (this.variants && this.variants.length > 0) {
    // Ensure all variants have unique SKUs
    const variantSkus = this.variants.map((v) => v.sku).filter(Boolean);
    const uniqueSkus = new Set(variantSkus);
    if (variantSkus.length !== uniqueSkus.size) {
      return next(new Error("Variant SKUs must be unique"));
    }
  }

  next();
});

// Pre-save: ensure at least one primary image
productSchema.pre("save", function (next) {
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some((img) => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Virtual: total stock across variants
productSchema.virtual("totalStock").get(function () {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  return this.stock;
});

// Virtual: lowest variant price (or product price)
productSchema.virtual("minPrice").get(function () {
  if (this.variants && this.variants.length > 0) {
    return Math.min(...this.variants.map((v) => v.price));
  }
  return this.price;
});

// Virtual: discount percentage
productSchema.virtual("discountPercent").get(function () {
  if (this.mrp > this.price) {
    return Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  return 0;
});

// Virtual: in stock
productSchema.virtual("inStock").get(function () {
  return this.totalStock > 0;
});

// Virtual: category-specific fields getter
productSchema.virtual("categoryFields").get(function () {
  return this.category === "toys" ? this.toysFields : this.jewelleryFields;
});

// Ensure virtuals are included
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

export default Product;