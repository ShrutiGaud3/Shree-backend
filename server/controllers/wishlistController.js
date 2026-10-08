import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js";

// GET /api/wishlist — populated items, newest first
const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate("items.product", "name slug price mrp images category subCategory stock ratingAvg ratingCount isActive")
    .lean();

  const items = (wishlist?.items || []).filter((i) => i.product && i.product.isActive !== false);
  res.status(200).json({ items, total: items.length });
};

// POST /api/wishlist { productId } — idempotent add (active products only)
const addToWishlist = async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findOne({ _id: productId, isActive: true }).select("_id").lean();
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // $addToSet can't dedupe here (each entry gets a fresh addedAt default),
  // so guard explicitly for a true idempotent add.
  const already = await Wishlist.findOne({ user: req.user._id, "items.product": productId })
    .select("_id")
    .lean();
  if (!already) {
    await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $push: { items: { product: productId } } },
      { upsert: true }
    ).exec();
  }

  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate("items.product", "name slug price mrp images category subCategory stock ratingAvg ratingCount isActive")
    .lean();

  const items = (wishlist?.items || []).filter((i) => i.product && i.product.isActive !== false);
  res.status(200).json({ items, total: items.length });
};

// DELETE /api/wishlist/:productId — silent when absent
const removeFromWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { items: { product: req.params.productId } } },
    { new: true }
  )
    .populate("items.product", "name slug price mrp images category subCategory stock ratingAvg ratingCount isActive")
    .lean();

  const items = (wishlist?.items || []).filter((i) => i.product && i.product.isActive !== false);
  res.status(200).json({ items, total: items.length });
};

const wishlistController = { getWishlist, addToWishlist, removeFromWishlist };

export default wishlistController;
