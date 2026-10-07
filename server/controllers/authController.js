import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/userModel.js";
import { passwordResetEmail } from "../utils/orderEmails.js";
import logger from "../utils/logger.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  addresses: user.addresses || [],
  isAdmin: user.isAdmin,
  isBlocked: user.isBlocked,
  isActive: user.isActive,
  token: generateToken(user._id),
});

const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error("Please fill all details!");
  }

  const emailExist = await User.findOne({ email: email.toLowerCase().trim() });
  const phoneExist = await User.findOne({ phone });
  if (emailExist || phoneExist) {
    res.status(409);
    throw new Error("User already exists");
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    res.status(400);
    throw new Error("Please enter a valid 10-digit Indian phone number");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, password: hashedPassword, phone });

  if (!user) {
    res.status(400);
    throw new Error("User not created!");
  }

  res.status(201).json(userResponse(user));
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill all details!");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  if (!user.isActive || user.isBlocked) {
    res.status(403);
    throw new Error("Account deactivated or blocked. Contact support.");
  }

  const safeUser = await User.findById(user._id);
  res.status(200).json(userResponse(safeUser));
};

const privateAccess = (req, res) => {
  res.json({ msg: `Request is made by : ${req?.user.name}` });
};

// POST /api/auth/forgot-password { email }
// Always 200 (no user enumeration). Token stored as SHA256 hash, 30-min expiry.
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const done = () =>
    res.status(200).json({ message: "If an account exists for this email, a reset link has been sent." });

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return done();

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetLink = `${frontend}/reset-password/${token}`;
  try {
    await passwordResetEmail(user, resetLink);
  } catch (error) {
    logger.error({ err: error.message }, "forgotPassword email failed");
  }
  return done();
};

// POST /api/auth/reset-password/:token { password }
const resetPassword = async (req, res) => {
  const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    res.status(400);
    throw new Error("Reset link is invalid or has expired");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successful. Please log in." });
};

const authControllers = { registerUser, loginUser, privateAccess, forgotPassword, resetPassword };

// --- Saved addresses (for checkout address select) ---
const getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses").lean();
  res.status(200).json(user?.addresses || []);
};

const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  user.addresses.push({
    label: req.body.label || "home",
    name: req.body.name,
    phone: req.body.phone,
    line1: req.body.line1,
    line2: req.body.line2,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    country: req.body.country || "India",
    isDefault: req.body.isDefault || user.addresses.length === 0,
  });
  await user.save();
  res.status(201).json(user.addresses);
};

const updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const addr = user.addresses.id(req.params.aid);
  if (!addr) {
    res.status(404);
    throw new Error("Address not found");
  }
  if (req.body.isDefault === true) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  Object.assign(addr, req.body);
  await user.save();
  res.status(200).json(user.addresses);
};

const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const addr = user.addresses.id(req.params.aid);
  if (!addr) {
    res.status(404);
    throw new Error("Address not found");
  }
  const wasDefault = addr.isDefault;
  addr.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  res.status(200).json(user.addresses);
};

authControllers.getAddresses = getAddresses;
authControllers.addAddress = addAddress;
authControllers.updateAddress = updateAddress;
authControllers.deleteAddress = deleteAddress;

export default authControllers;
