import express from "express";
import productController from "../controllers/productController.js";
import { validate } from "../middleware/validate.js";
import { productQuerySchema } from "../validators/schemas.js";

import reviewRoutes from "../routes/reviewRoutes.js";

const router = express.Router({ mergeParams: true });

router.get("/", validate(productQuerySchema), productController.getProducts);
router.get("/:pid", productController.getProduct);
router.get("/search/:query", productController.searchProduct);

const addProductMiddleware = (req, res, next) => {
  // add to request object
  req.pid = req.params.pid;
  next();
};

router.use("/:pid/review/", addProductMiddleware, reviewRoutes);

export default router;
