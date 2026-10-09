import Product from "../models/productModel.js";
import { STORE_CONFIG } from "../config/storeConfig.js";

// Public catalog: GET /api/products?q=&category=&subCategory=&minPrice=&maxPrice=
//   &ageGroup=&material=&colour=&minRating=&inStock=&sort=&page=&limit=
// Returns { items, page, totalPages, total }. Always .lean(), active only.

const SORT_MAP = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
};

const toNumberOrUndefined = (value) => {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export const buildProductFilter = (query = {}) => {
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.subCategory) filter.subCategory = query.subCategory;

  const minPrice = toNumberOrUndefined(query.minPrice);
  const maxPrice = toNumberOrUndefined(query.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (query.ageGroup) filter["toysFields.ageGroup"] = query.ageGroup;
  if (query.material) filter["jewelleryFields.material"] = query.material;

  // Additive Feature 1: colour (case-insensitive exact), rating, availability.
  // All optional — old clients that omit them get identical results.
  if (query.colour) filter.colour = { $regex: `^${query.colour.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };

  const minRating = toNumberOrUndefined(query.minRating);
  if (minRating !== undefined) filter.ratingAvg = { $gte: minRating };

  if (query.inStock === "true") {
    filter.$and = [...(filter.$and || []), { $or: [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }] }];
  } else if (query.inStock === "false") {
    filter.$and = [
      ...(filter.$and || []),
      { stock: { $lte: 0 } },
      { "variants.stock": { $not: { $gt: 0 } } },
    ];
  }

  if (query.q) filter.$text = { $search: query.q };

  return filter;
};

// In-memory cache for public product listings (TTL: 60s, max 100 entries)
const catalogCache = new Map();
const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_SIZE = 100;

export const clearProductCache = () => {
  catalogCache.clear();
};

const getFromCache = (key) => {
  const entry = catalogCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    catalogCache.delete(key);
    return null;
  }
  return entry.data;
};

const setInCache = (key, data) => {
  if (catalogCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = catalogCache.keys().next().value;
    catalogCache.delete(oldestKey);
  }
  catalogCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

const listProducts = async (filter, { page, limit, sort, hasTextSearch }) => {
  const skip = (page - 1) * limit;

  // Text relevance ranking when searching without an explicit sort
  let sortStage = SORT_MAP[sort] || SORT_MAP.newest;
  let projection = "-description -careInstructions -metaTitle -metaDescription";
  if (hasTextSearch && !sort) {
    projection = { score: { $meta: "textScore" } };
    sortStage = { score: { $meta: "textScore" } };
  }

  const [total, items] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter, projection).sort(sortStage).skip(skip).limit(limit).lean(),
  ]);

  return {
    items,
    page,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    total,
  };
};

const getProducts = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || STORE_CONFIG.defaultPage);
  const limit = Math.min(
    STORE_CONFIG.maxLimit,
    Math.max(1, parseInt(req.query.limit, 10) || STORE_CONFIG.defaultLimit)
  );

  const cacheKey = JSON.stringify(req.query);
  const cached = getFromCache(cacheKey);
  if (cached) {
    res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=300");
    res.set("X-Cache", "HIT");
    return res.status(200).json(cached);
  }

  const filter = buildProductFilter(req.query);
  const result = await listProducts(filter, {
    page,
    limit,
    sort: req.query.sort,
    hasTextSearch: Boolean(req.query.q),
  });

  setInCache(cacheKey, result);
  res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=300");
  res.set("X-Cache", "MISS");
  res.status(200).json(result);
};

const getProduct = async (req, res) => {
  const { pid } = req.params;
  const query = pid.match(/^[0-9a-fA-F]{24}$/) ? { _id: pid } : { slug: pid };
  const product = await Product.findOne({ ...query, isActive: true }).lean();

  if (!product) {
    res.status(404);
    throw new Error("Product Not Found!");
  }

  // Fire-and-forget view counter (never blocks the response)
  Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).exec();

  res.set("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=120");
  res.status(200).json(product);
};

// Back-compat alias: GET /api/products/search/:query
const searchProduct = async (req, res) => {
  req.query.q = req.params.query;
  return getProducts(req, res);
};

const productController = { getProduct, getProducts, searchProduct, clearProductCache };

export default productController;
