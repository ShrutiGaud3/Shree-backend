import express from "express";
import shippingController from "../controllers/shippingController.js";
import { validate } from "../middleware/validate.js";
import { pincodeCheckSchema } from "../validators/schemas.js";

const router = express.Router();

// Public delivery estimate (no auth needed — used on product pages)
router.get("/check/:pincode", validate(pincodeCheckSchema), shippingController.checkPincode);

export default router;
