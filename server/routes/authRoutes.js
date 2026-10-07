import express from "express";
import authControllers from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, createAddressSchema, updateAddressSchema, addressParamsSchema } from "../validators/schemas.js";

const router = express.Router();

router.post("/register", validate(registerSchema), authControllers.registerUser);
router.post("/login", validate(loginSchema), authControllers.loginUser);
router.post("/forgot-password", validate(forgotPasswordSchema), authControllers.forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), authControllers.resetPassword);

router.get("/addresses", protect.forAuthUsers, authControllers.getAddresses);
router.post("/addresses", protect.forAuthUsers, validate(createAddressSchema), authControllers.addAddress);
router.put("/addresses/:aid", protect.forAuthUsers, validate(updateAddressSchema), authControllers.updateAddress);
router.delete("/addresses/:aid", protect.forAuthUsers, validate(addressParamsSchema), authControllers.deleteAddress);

router.post("/private", protect.forAuthUsers, authControllers.privateAccess);

export default router;
