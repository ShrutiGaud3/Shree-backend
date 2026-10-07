import express from "express";
import protect from "../middleware/authMiddleware.js";
import paymentController from "../controllers/paymentController.js";
import { validate } from "../middleware/validate.js";
import { verifyPaymentSchema } from "../validators/schemas.js";

const router = express.Router();

// Publishable key for checkout.js (public by design)
router.get("/key", paymentController.getKey);

// Verify checkout signature (user owns the order)
router.post("/verify", protect.forAuthUsers, validate(verifyPaymentSchema), paymentController.verifyPayment);

// Razorpay server webhook — raw body + signature header (no JWT).
// server.js mounts express.raw() on this exact path before express.json().
router.post("/webhook", paymentController.webhook);

export default router;
