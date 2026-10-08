import express from "express";
import supportController from "../controllers/supportController.js";
import { validate } from "../middleware/validate.js";
import { createSupportSchema } from "../validators/schemas.js";

const router = express.Router();

// Public contact form (rate-limited with the rest of /api/)
router.post("/", validate(createSupportSchema), supportController.createMessage);

export default router;
