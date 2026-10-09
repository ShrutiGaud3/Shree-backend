// Zod request validators for Shree single-vendor store.
// Each export matches the shape expected by middleware/validate.js:
//   z.object({ body, query, params }) — include only the parts you need.
// Category cross-field rules (toys-only vs jewellery-only) enforced via refine.

import { z } from "zod";
import { TOP_LEVEL_CATEGORIES, ALL_SUB_CATEGORIES, isValidSubCategory } from "../config/categories.js";

// ---------- shared primitives ----------
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const phone = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
const pincode = z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode");

export const addressSchema = z.object({
  label: z.enum(["home", "work", "other"]).default("home"),
  name: z.string().trim().min(2).max(50),
  phone,
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode,
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});

// ---------- auth ----------
export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(50),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phone,
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({ token: z.string().regex(/^[0-9a-f]{64}$/, "Invalid reset token") }),
  body: z.object({
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
  }),
});

// ---------- product ----------
const toysFields = z
  .object({
    ageGroup: z.enum(["0-3", "3-6", "6-12", "12+"]).optional(),
    safetyCertifications: z.array(z.string().trim().max(40)).max(10).optional(),
    batteryRequired: z.boolean().optional(),
  })
  .optional();

const jewelleryFields = z
  .object({
    material: z
      .enum(["gold-plated", "silver-925", "artificial", "platinum-plated", "rose-gold-plated", "brass", "copper"])
      .optional(),
    purity: z.string().trim().max(20).optional(),
    stoneType: z.string().trim().max(40).optional(),
    weightGrams: z.number().min(0).optional(),
    hallmarkNumber: z.string().trim().max(40).optional(),
    careInstructions: z.string().trim().max(1000).optional(),
  })
  .optional();

const variantSchema = z.object({
  label: z.string().trim().min(1).max(100),
  sku: z.string().trim().min(1).max(40),
  price: z.number().min(0),
  stock: z.number().int().min(0),
});

const baseProductFields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(5000),
  shortDescription: z.string().trim().max(300).optional(),
  category: z.enum(TOP_LEVEL_CATEGORIES),
  subCategory: z.enum(ALL_SUB_CATEGORIES),
  brand: z.string().trim().max(50).optional(),
  sku: z.string().trim().min(2).max(40),
  tags: z.array(z.string().trim().max(30)).max(20).optional(),
  colour: z.string().trim().max(30).optional(),
  mrp: z.number().min(0),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  variants: z.array(variantSchema).max(20).optional(),
  toysFields,
  jewelleryFields,
  gstRate: z.number().min(0).max(100).optional(),
  isReturnable: z.boolean().optional(),
  guarantee: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
};

// Toys-only fields must not appear on jewellery and vice versa;
// subCategory must belong to category.
const productRefine = (data) => {
  if (!isValidSubCategory(data.category, data.subCategory)) return false;
  const toyKeys = ["ageGroup", "safetyCertifications", "batteryRequired"];
  const jewelKeys = ["material", "purity", "stoneType", "weightGrams", "hallmarkNumber", "careInstructions"];
  const has = (obj, keys) =>
    obj && keys.some((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== "");
  if (data.category === "toys" && has(data.jewelleryFields, jewelKeys)) return false;
  if (data.category === "jewellery" && has(data.toysFields, toyKeys)) return false;
  return true;
};

export const createProductSchema = z.object({
  body: z.object(baseProductFields).refine(productRefine, {
    message: "subCategory must belong to category; toys-only and jewellery-only fields are mutually exclusive",
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ pid: objectId }),
  body: z
    .object({
      ...baseProductFields,
      name: baseProductFields.name.optional(),
      removeImages: z.union([z.array(z.string()), z.string()]).optional(),
    })
    .partial()
    .refine(
      (data) => {
        if (data.category && data.subCategory) return productRefine(data);
        return true;
      },
      { message: "subCategory must belong to category; category-specific fields are mutually exclusive" }
    ),
});

export const productQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(100).optional(),
    category: z.enum(TOP_LEVEL_CATEGORIES).optional(),
    subCategory: z.string().trim().max(40).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    ageGroup: z.enum(["0-3", "3-6", "6-12", "12+"]).optional(),
    material: z.string().trim().max(40).optional(),
    colour: z.string().trim().max(30).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    inStock: z.enum(["true", "false"]).optional(),
    sort: z.enum(["price_asc", "price_desc", "newest", "rating"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
});

export const productParamsSchema = z.object({
  params: z.object({ pid: z.string().min(1) }), // id or slug
});

// ---------- cart ----------
export const addToCartSchema = z.object({
  body: z.object({
    productId: objectId,
    qty: z.coerce.number().int().min(1).max(99).default(1),
    variantSku: z.string().trim().max(40).optional(),
  }),
});

export const updateCartSchema = z.object({
  body: z.object({
    productId: objectId,
    qty: z.coerce.number().int().min(1).max(99),
    variantSku: z.string().trim().max(40).optional(),
  }),
});

// ---------- order / checkout ----------
export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: addressSchema,
    couponCode: z.string().trim().max(20).optional(),
    paymentMethod: z.enum(["cod", "razorpay"]).default("cod"),
    customerNotes: z.string().trim().max(500).optional(),
    gift: z
      .object({
        isGift: z.boolean().default(false),
        message: z.string().trim().max(200).optional().default(""),
      })
      .optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({ oid: objectId }),
  body: z.object({ reason: z.string().trim().max(500).optional() }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ oid: objectId }),
  body: z.object({
    status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded", "completed"]),
    note: z.string().trim().max(500).optional(),
  }),
});

// ---------- coupon ----------
export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(3).max(20),
    description: z.string().trim().max(200).optional(),
    discountType: z.enum(["percentage", "fixed"]).default("percentage"),
    discountValue: z.number().min(0),
    maxDiscount: z.number().min(0).optional(),
    minOrderValue: z.number().min(0).default(0),
    applicableCategory: z.enum(["toys", "jewellery", "all"]).default("all"),
    usageLimit: z.number().int().min(0).default(0),
    perUserLimit: z.number().int().min(1).default(1),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date(),
    isActive: z.boolean().default(true),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({ cid: objectId }),
  body: z
    .object({
      description: z.string().trim().max(200),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().min(0),
      maxDiscount: z.number().min(0),
      minOrderValue: z.number().min(0),
      applicableCategory: z.enum(["toys", "jewellery", "all"]),
      usageLimit: z.number().int().min(0),
      perUserLimit: z.number().int().min(1),
      startsAt: z.coerce.date(),
      expiresAt: z.coerce.date(),
      isActive: z.boolean(),
    })
    .partial(),
});

export const applyCouponSchema = z.object({
  body: z.object({
    couponCode: z.string().trim().min(1).max(20),
    orderValue: z.coerce.number().min(0).default(0),
  }),
});

// ---------- review ----------
export const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(100).optional(),
    text: z.string().trim().min(3).max(2000),
  }),
});

// ---------- saved addresses ----------
export const createAddressSchema = z.object({ body: addressSchema });

export const updateAddressSchema = z.object({
  params: z.object({ aid: objectId }),
  body: addressSchema.partial(),
});

export const addressParamsSchema = z.object({
  params: z.object({ aid: objectId }),
});

// ---------- admin ----------
export const updateUserSchema = z.object({
  params: z.object({ uid: objectId }),
  body: z
    .object({
      isBlocked: z.boolean(),
      isActive: z.boolean(),
      isAdmin: z.boolean(),
    })
    .partial()
    .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" }),
});

// ---------- chatbot ----------
export const chatSchema = z.object({
  body: z.object({
    question: z.string().trim().min(2).max(1000),
  }),
});

// ---------- shipping / pincode ----------
export const pincodeCheckSchema = z.object({
  params: z.object({ pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode") }),
});

// ---------- wishlist ----------
export const addToWishlistSchema = z.object({
  body: z.object({ productId: objectId }),
});

export const wishlistParamsSchema = z.object({
  params: z.object({ productId: objectId }),
});

// ---------- CMS blocks ----------
export const cmsQuerySchema = z.object({
  query: z.object({
    section: z.enum(["announcement", "offer", "testimonial", "gallery"]).optional(),
  }),
});

const cmsBlockFields = {
  section: z.enum(["announcement", "offer", "testimonial", "gallery"]),
  title: z.string().trim().max(120).optional(),
  subtitle: z.string().trim().max(200).optional(),
  content: z.string().trim().max(2000).optional(),
  name: z.string().trim().max(60).optional(),
  rating: z.number().min(1).max(5).optional(),
  image: z.string().trim().max(500).optional(),
  link: z.string().trim().max(500).optional(),
  linkLabel: z.string().trim().max(40).optional(),
  endsAt: z.coerce.date().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
};

export const createCmsBlockSchema = z.object({
  body: z.object(cmsBlockFields),
});

export const updateCmsBlockSchema = z.object({
  params: z.object({ bid: objectId }),
  body: z.object(cmsBlockFields).partial(),
});

// ---------- newsletter ----------
export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    source: z.string().trim().max(30).optional(),
  }),
});

// ---------- analytics ----------
export const analyticsQuerySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(90).default(14),
  }),
});

// ---------- reviews moderation (admin) ----------
export const reviewAdminQuerySchema = z.object({
  query: z.object({
    approved: z.enum(["true", "false"]).optional(),
    reported: z.enum(["true"]).optional(),
  }),
});

export const moderateReviewSchema = z.object({
  params: z.object({ rid: objectId }),
  body: z.object({ isApproved: z.boolean() }),
});

export const replyReviewSchema = z.object({
  params: z.object({ rid: objectId }),
  body: z.object({ text: z.string().trim().min(1).max(1000) }),
});

// ---------- settings (admin allow-list) ----------
export const updateSettingsSchema = z.object({
  body: z
    .object({
      freeShippingThreshold: z.number().min(0).optional(),
      shippingFee: z.number().min(0).optional(),
      codMaxOrderValue: z.number().min(0).optional(),
      giftWrapFee: z.number().min(0).optional(),
      storeNotice: z.string().trim().max(300).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one setting to update" }),
});

// ---------- support inbox ----------
const supportPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
  .optional();

export const createSupportSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(50),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phone: supportPhone,
    subject: z.string().trim().min(3).max(100),
    message: z.string().trim().min(10).max(2000),
  }),
});

export const supportAdminQuerySchema = z.object({
  query: z.object({
    status: z.enum(["new", "read", "replied", "closed"]).optional(),
  }),
});

export const updateSupportSchema = z.object({
  params: z.object({ mid: objectId }),
  body: z
    .object({
      status: z.enum(["new", "read", "replied", "closed"]).optional(),
      adminReply: z.string().trim().min(1).max(2000).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: "Provide status or adminReply to update" }),
});

// ---------- refunds / invoices / reports ----------
export const orderIdParamsSchema = z.object({
  params: z.object({ oid: objectId }),
});

export const refundOrderSchema = z.object({
  params: z.object({ oid: objectId }),
  body: z.object({
    amount: z.number().positive().optional(),
    reason: z.string().trim().max(500).optional(),
  }),
});

export const reportParamsSchema = z.object({
  params: z.object({
    type: z.enum(["sales", "orders", "inventory", "customers", "newsletter"]),
  }),
  query: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  }),
});

// ---------- payments ----------
export const verifyPaymentSchema = z.object({  body: z.object({
    orderId: objectId,
    razorpayOrderId: z.string().min(1).max(40),
    razorpayPaymentId: z.string().min(1).max(40),
    razorpaySignature: z.string().min(1).max(256),
  }),
});
