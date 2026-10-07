import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX || 300);
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX || 30);

export const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

export const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again later" },
});
