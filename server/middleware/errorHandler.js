// Global error handler middleware
// Handles Mongoose CastError (404), duplicate key (409), validation (400), and others

import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  // Default status code
  let statusCode = err.statusCode || (res.statusCode <= 200 ? 500 : res.statusCode);
  let message = err.message || "Internal Server Error";

  // Mongoose CastError (invalid ObjectId) -> 404
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 404;
    message = `Resource not found: Invalid ${err.path} (${err.value})`;
  }

  // Mongoose duplicate key error -> 409
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" already exists`;
  }

  // Mongoose validation error -> 400
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join("; ");
  }

  // Zod validation error (from validate middleware)
  if (err.name === "ValidationError" || err.name === "ZodValidationError") {
    statusCode = 400;
    message = err.message || "Validation failed";
    if (err.errors) {
      message = err.errors.map((e) => `${(e.path || []).join(".")}: ${e.message}`).join("; ");
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File too large. Maximum size is 5MB";
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    statusCode = 400;
    message = "Too many files";
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected file field";
  }

  // Cloudinary errors
  if (err.message?.includes("cloudinary")) {
    statusCode = 502;
    message = "Image upload failed";
  }

  // Log error (pino; verbose in development only)
  if (process.env.NODE_ENV === "development") {
    logger.error(
      {
        statusCode,
        path: req.originalUrl,
        method: req.method,
        stack: err.stack,
      },
      err.message
    );
  } else if (statusCode >= 500) {
    logger.error({ statusCode, path: req.originalUrl, method: req.method }, err.message);
  }

  // Response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};