import express from "express";
import cmsController from "../controllers/cmsController.js";
import { validate } from "../middleware/validate.js";
import { cmsQuerySchema } from "../validators/schemas.js";

const router = express.Router();

// Public homepage content (active + date-valid only)
router.get("/", validate(cmsQuerySchema), cmsController.getBlocks);

export default router;
