import express from "express";
import newsletterController from "../controllers/newsletterController.js";
import { validate } from "../middleware/validate.js";
import { subscribeSchema } from "../validators/schemas.js";

const router = express.Router();

// Public signup (idempotent — repeat emails return success)
router.post("/subscribe", validate(subscribeSchema), newsletterController.subscribe);

export default router;
