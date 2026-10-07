import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const verifyToken = async (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.isActive || user.isBlocked) {
    throw new Error("Account deactivated or blocked");
  }
  return user;
};

const forAuthUsers = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      const err = new Error("Not authorized, no token");
      err.statusCode = 401;
      throw err;
    }
    const token = authHeader.split(" ")[1];
    req.user = await verifyToken(token);
    next();
  } catch (error) {
    const err = new Error(error.message || "Not authorized, token failed");
    err.statusCode = 401;
    next(err);
  }
};

const forAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      const err = new Error("Not authorized, no token");
      err.statusCode = 401;
      throw err;
    }
    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);
    if (!user.isAdmin) {
      const err = new Error("Not authorized, admin only");
      err.statusCode = 403;
      throw err;
    }
    req.user = user;
    next();
  } catch (error) {
    const err = new Error(error.message || "Not authorized, admin only");
    err.statusCode = error.statusCode || 403;
    next(err);
  }
};

const forAdminOrSelf = (paramName = "user") => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      const err = new Error("Not authorized, no token");
      err.statusCode = 401;
      throw err;
    }
    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);
    if (user.isAdmin) {
      req.user = user;
      return next();
    }
    req.user = user;
    req.resourceUserId = req.params[paramName] || req.body[paramName] || req.query[paramName];
    next();
  } catch (error) {
    const err = new Error(error.message || "Not authorized");
    err.statusCode = error.statusCode || 401;
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      req.user = await verifyToken(token);
    }
    next();
  } catch {
    next();
  }
};

const protect = { forAuthUsers, forAdmin, forAdminOrSelf, optionalAuth };

export default protect;
