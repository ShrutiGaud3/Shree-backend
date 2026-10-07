import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getAnswer } from "../controllers/chatBotController.js";
import { validate } from "../middleware/validate.js";
import { chatSchema } from "../validators/schemas.js";

const router = express.Router();

router.post("/", protect.forAuthUsers, validate(chatSchema), getAnswer);

export default router;
