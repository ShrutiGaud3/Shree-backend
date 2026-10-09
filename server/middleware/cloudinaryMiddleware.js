// Cloudinary upload middleware
// Uses memory storage (no disk writes), validates file type/size

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

// Configuration from env
cloudinary.config({
  cloud_name: cloudName || "",
  api_key: apiKey || "",
  api_secret: apiSecret || "",
});

// Validate Cloudinary config on startup
if (!cloudName || !apiKey || !apiSecret) {
  console.warn("⚠️  Cloudinary credentials not fully configured — local image fallback will be used");
}

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Upload buffer to Cloudinary
export const uploadToCloudinary = async (buffer, options = {}) => {
  const cName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cSec = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cName || !cKey || !cSec) {
    throw new Error("Cloudinary credentials not configured");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: options.folder || "shree/products",
        transformation: options.transformation || [
          { width: 1200, height: 1200, crop: "limit", quality: "auto" },
        ],
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Delete image from Cloudinary by public_id
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || publicId.startsWith("local_")) return null;
  const cName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cSec = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cName || !cKey || !cSec) return null;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.warn("Cloudinary delete ignored/failed:", error?.message || error);
    return null;
  }
};

// Extract public_id from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const publicId = filename.split(".")[0];
  const folderParts = parts.slice(parts.indexOf("shree"));
  return folderParts.join("/").split(".")[0];
};

// Multer memory storage (no disk writes)
import multer from "multer";

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed"), false);
  }
};

export const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Max 5 images per product
  },
});

// Middleware for single image upload (field name: 'image')
export const uploadSingle = upload.single("image");

// Middleware for multiple images upload (field name: 'images')
export const uploadMultiple = upload.array("images", 5);

// Error handler for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const error = new Error(err.message);
    error.statusCode = 400;
    return next(error);
  }
  if (err) {
    const error = new Error(err.message);
    error.statusCode = 400;
    return next(error);
  }
  next();
};