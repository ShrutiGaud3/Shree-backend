import express from "express";
import couponController from "../controllers/couponController.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { applyCouponSchema } from "../validators/schemas.js";

const router = express.Router();

// Store-wide active coupons
router.get("/", couponController.getCoupons);
router.post("/apply", protect.forAuthUsers, validate(applyCouponSchema), couponController.applyCoupon);

export default router;
