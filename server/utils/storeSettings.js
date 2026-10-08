import Setting from "../models/settingModel.js";
import { STORE_CONFIG } from "../config/storeConfig.js";

// Effective store config: static defaults merged with admin overrides.
// Cached 60s; any failure falls back to static defaults (never throws).
const NUMBER_KEYS = ["freeShippingThreshold", "shippingFee", "codMaxOrderValue", "giftWrapFee"];

let cache = null;
let cachedAt = 0;

export const getStoreSettings = async () => {
  try {
    if (cache && Date.now() - cachedAt < 60000) return cache;
    const rows = await Setting.find({ key: { $in: [...NUMBER_KEYS, "storeNotice"] } }).lean();
    const overrides = {};
    for (const r of rows || []) {
      if (NUMBER_KEYS.includes(r.key) && Number.isFinite(Number(r.value)) && Number(r.value) >= 0) {
        overrides[r.key] = Number(r.value);
      } else if (r.key === "storeNotice" && typeof r.value === "string") {
        overrides[r.key] = r.value.slice(0, 300);
      }
    }
    cache = { ...STORE_CONFIG, ...overrides };
    cachedAt = Date.now();
    return cache;
  } catch {
    return { ...STORE_CONFIG };
  }
};

export const invalidateStoreSettings = () => {
  cache = null;
};
