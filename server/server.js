import express from "express";
import dotenv from "dotenv";
import colors from "colors";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { connectDB } from "./config/dbConfig.js";
import { STORE_NAME } from "./config/storeConfig.js";
import logger from "./utils/logger.js";
import mongoose from "mongoose";

dotenv.config();

// Route imports (single-vendor: no shop / shop-owner routes)
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimit.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import chatBotRoutes from "./routes/chatBotRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { startStaleOrderJob } from "./utils/staleOrders.js";

const app = express();
const PORT = process.env.PORT || 5000;

// DB Connection (non-blocking; logs on failure)
connectDB();

// Security + observability (Phase 2)
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(pinoHttp({ logger }));

// Razorpay webhook needs the RAW body for signature verification —
// mount express.raw() on that exact path BEFORE the JSON parser.
app.use("/api/payments/webhook", express.raw({ type: "application/json", limit: "100kb" }));

// Body parsers with sane limits (fixes oversized-payload DoS)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Rate limits
app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

app.get("/", (req, res) => {
  res.status(200).json({ message: `WELCOME TO ${STORE_NAME.toUpperCase()} API 1.0` });
});

app.get("/api/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.status(200).json({
    success: true,
    store: STORE_NAME,
    status: "ok",
    time: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    db: dbStates[mongoose.connection.readyState] ?? "unknown",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/chat", chatBotRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 + global error handler (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`SERVER IS RUNNING AT PORT : ${PORT}`.bgBlue.black));

// Auto-cancel stale unpaid prepaid orders + release their stock (Phase 4)
if (process.env.DISABLE_STALE_ORDER_JOB !== "true") {
  startStaleOrderJob();
}

export default app;
