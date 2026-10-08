import express from "express";
import wishlistController from "../controllers/wishlistController.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { addToWishlistSchema, wishlistParamsSchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/", protect.forAuthUsers, wishlistController.getWishlist);
router.post("/", protect.forAuthUsers, validate(addToWishlistSchema), wishlistController.addToWishlist);
router.delete(
  "/:productId",
  protect.forAuthUsers,
  validate(wishlistParamsSchema),
  wishlistController.removeFromWishlist
);

export default router;
