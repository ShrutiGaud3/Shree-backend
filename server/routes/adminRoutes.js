import express from "express";
import adminControllers from "../controllers/adminController.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { uploadMultiple, handleUploadError } from "../middleware/cloudinaryMiddleware.js";
import { normalizeProductBody } from "../middleware/productForm.js";
import {
  updateUserSchema,
  updateOrderStatusSchema,
  createProductSchema,
  updateProductSchema,
  createCouponSchema,
  updateCouponSchema,
} from "../validators/schemas.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", protect.forAdmin, adminControllers.getDashboard);

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

export default router;
