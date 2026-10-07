import Product from "../models/productModel.js";
import { STORE_CONFIG } from "../config/storeConfig.js";

// Public catalog: GET /api/products?q=&category=&subCategory=&minPrice=&maxPrice=
//   &ageGroup=&material=&sort=&page=&limit=
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

  if (query.q) filter.$text = { $search: query.q };

  return filter;
};

const listProducts = async (filter, { page, limit, sort, hasTextSearch }) => {
  const skip = (page - 1) * limit;

  // Text relevance ranking when searching without an explicit sort
  let sortStage = SORT_MAP[sort] || SORT_MAP.newest;
  let projection = {};
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

  const filter = buildProductFilter(req.query);
  const result = await listProducts(filter, {
    page,
    limit,
    sort: req.query.sort,
    hasTextSearch: Boolean(req.query.q),
  });

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

  res.status(200).json(product);
};

// Back-compat alias: GET /api/products/search/:query
const searchProduct = async (req, res) => {
  req.query.q = req.params.query;
  return getProducts(req, res);
};

const productController = { getProduct, getProducts, searchProduct };

export default productController;
