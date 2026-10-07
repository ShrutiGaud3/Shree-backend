import express from "express";
import reviewController from "../controllers/reviewController.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/", reviewController.getReviews);
router.post("/", protect.forAuthUsers, validate(createReviewSchema), reviewController.addReview);
router.delete("/:rid", protect.forAuthUsers, reviewController.removeReview);

export default router;
