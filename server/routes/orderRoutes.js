import express from "express";
import protect from "../middleware/authMiddleware.js";
import orderController from "../controllers/orderController.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema, cancelOrderSchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/", protect.forAuthUsers, orderController.getMyOrders);
router.get("/:oid", protect.forAuthUsers, orderController.getMyOrder);
router.post("/", protect.forAuthUsers, validate(createOrderSchema), orderController.createOrder);
router.put("/:oid", protect.forAuthUsers, validate(cancelOrderSchema), orderController.cancelOrder);

export default router;
