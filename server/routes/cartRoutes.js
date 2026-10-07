import express from "express";
import protect from "../middleware/authMiddleware.js";
import cartController from "../controllers/cartController.js";
import { validate } from "../middleware/validate.js";
import { addToCartSchema, updateCartSchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/", protect.forAuthUsers, cartController.getCart);
router.post("/", protect.forAuthUsers, validate(addToCartSchema), cartController.addToCart);
router.put("/:cid", protect.forAuthUsers, validate(updateCartSchema), cartController.updateCart);
router.delete("/:productId", protect.forAuthUsers, cartController.removeCart);
router.post("/clear", protect.forAuthUsers, cartController.clearCart);

export default router;
