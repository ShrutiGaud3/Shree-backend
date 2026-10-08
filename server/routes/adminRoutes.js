import express from "express";
import adminControllers from "../controllers/adminController.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { uploadMultiple, handleUploadError } from "../middleware/cloudinaryMiddleware.js";
import { normalizeProductBody } from "../middleware/productForm.js";
import cmsController from "../controllers/cmsController.js";
import newsletterController from "../controllers/newsletterController.js";
import analyticsController from "../controllers/analyticsController.js";
import invoiceController from "../controllers/invoiceController.js";
import refundController from "../controllers/refundController.js";
import reportsController from "../controllers/reportsController.js";
import reviewAdminController from "../controllers/reviewAdminController.js";
import settingsController from "../controllers/settingsController.js";
import supportController from "../controllers/supportController.js";
import {
  updateUserSchema,
  updateOrderStatusSchema,
  createProductSchema,
  updateProductSchema,
  createCouponSchema,
  updateCouponSchema,
  createCmsBlockSchema,
  updateCmsBlockSchema,
  analyticsQuerySchema,
  reviewAdminQuerySchema,
  moderateReviewSchema,
  replyReviewSchema,
  updateSettingsSchema,
  supportAdminQuerySchema,
  updateSupportSchema,
  orderIdParamsSchema,
  refundOrderSchema,
  reportParamsSchema,
} from "../validators/schemas.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", protect.forAdmin, adminControllers.getDashboard);

// Analytics rollups for charts (new path; dashboard response untouched)
router.get("/analytics", protect.forAdmin, validate(analyticsQuerySchema), analyticsController.getAnalytics);

// Users (block/unblock via isBlocked, activate via isActive)
router.get("/users", protect.forAdmin, adminControllers.getUsers);
router.put("/users/:uid", protect.forAdmin, validate(updateUserSchema), adminControllers.updateUser);

// Orders (single-vendor)
router.get("/orders", protect.forAdmin, adminControllers.getAllOrders);
router.put("/orders/:oid", protect.forAdmin, validate(updateOrderStatusSchema), adminControllers.updateOrderStatus);

// Products (multipart "images" up to 5 x 5MB jpg/png/webp; JSON bodies work too)
router.get("/products", protect.forAdmin, adminControllers.getProductsAdmin);
router.post(
  "/products",
  protect.forAdmin,
  uploadMultiple,
  handleUploadError,
  normalizeProductBody,
  validate(createProductSchema),
  adminControllers.createProduct
);
router.put(
  "/products/:pid",
  protect.forAdmin,
  uploadMultiple,
  handleUploadError,
  normalizeProductBody,
  validate(updateProductSchema),
  adminControllers.updateProduct
);
router.delete("/products/:pid", protect.forAdmin, adminControllers.deleteProduct);

// Coupons (merged from shop-owner; full rules in Phase 5)
router.get("/coupons", protect.forAdmin, adminControllers.getCouponsAdmin);
router.post("/coupons", protect.forAdmin, validate(createCouponSchema), adminControllers.createCoupon);
router.put("/coupons/:cid", protect.forAdmin, validate(updateCouponSchema), adminControllers.updateCoupon);
router.delete("/coupons/:cid", protect.forAdmin, validate(updateCouponSchema), adminControllers.deleteCoupon);

// CMS content blocks (homepage sections, admin-managed)
router.get("/cms", protect.forAdmin, cmsController.getBlocksAdmin);
router.post("/cms", protect.forAdmin, validate(createCmsBlockSchema), cmsController.createBlock);
router.put("/cms/:bid", protect.forAdmin, validate(updateCmsBlockSchema), cmsController.updateBlock);
router.delete("/cms/:bid", protect.forAdmin, cmsController.deleteBlock);

// Newsletter subscribers (read-only list)
router.get("/newsletter", protect.forAdmin, newsletterController.getSubscribersAdmin);

// Reviews moderation (public listing already filters isApproved)
router.get("/reviews", protect.forAdmin, validate(reviewAdminQuerySchema), reviewAdminController.getReviewsAdmin);
router.put("/reviews/:rid", protect.forAdmin, validate(moderateReviewSchema), reviewAdminController.moderateReview);
router.post("/reviews/:rid/reply", protect.forAdmin, validate(replyReviewSchema), reviewAdminController.replyReview);
router.delete("/reviews/:rid", protect.forAdmin, reviewAdminController.deleteReviewAdmin);

// Store settings (allow-listed keys; static defaults until overridden)
router.get("/settings", protect.forAdmin, settingsController.getSettingsAdmin);
router.put("/settings", protect.forAdmin, validate(updateSettingsSchema), settingsController.updateSettingsAdmin);

// Support inbox
router.get("/support", protect.forAdmin, validate(supportAdminQuerySchema), supportController.getMessagesAdmin);
router.put("/support/:mid", protect.forAdmin, validate(updateSupportSchema), supportController.updateMessageAdmin);

// Invoice PDF (any order)
router.get("/orders/:oid/invoice", protect.forAdmin, validate(orderIdParamsSchema), invoiceController.adminInvoice);

// Admin-initiated refund (prepaid orders only; cancel-flow refunds untouched)
router.post("/orders/:oid/refund", protect.forAdmin, validate(refundOrderSchema), refundController.refundOrder);

// CSV reports
router.get("/reports/:type", protect.forAdmin, validate(reportParamsSchema), reportsController.downloadReport);

export default router;
