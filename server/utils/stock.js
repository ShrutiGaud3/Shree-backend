// Atomic stock reserve/release without replica-set transactions.
// Each line item is reserved with a single conditional atomic update:
//   - plain product: {_id, stock: {$gte: qty}} + $inc stock by -qty
//   - variant:      {_id, "variants.sku": sku} + $inc variants.$[v].stock
//     guarded by arrayFilter {"v.sku": sku, "v.stock": {$gte: qty}}
// On any failure, already-reserved lines are rolled back (compensating $inc).

import Product from "../models/productModel.js";

// items: [{ product: ObjectId|string, variant?: {sku}, qty }]
// Returns the reserved lines (same shape) or throws with statusCode 409.
export const reserveStock = async (items) => {
  const reserved = [];

  for (const item of items) {
    const productId = item.product?._id || item.product;
    const qty = item.qty;
    const sku = item.variant?.sku;

    let ok = false;
    if (sku) {
      // Atomic conditional decrement; modifiedCount tells us if a variant
      // element actually matched (race-safe under concurrency).
      const r = await Product.updateOne(
        { _id: productId, isActive: true },
        { $inc: { "variants.$[v].stock": -qty, soldCount: qty } },
        { arrayFilters: [{ "v.sku": sku, "v.stock": { $gte: qty } }] }
      );
      ok = r.modifiedCount === 1;
    } else {
      const updated = await Product.findOneAndUpdate(
        { _id: productId, isActive: true, stock: { $gte: qty } },
        { $inc: { stock: -qty, soldCount: qty } },
        { new: false, projection: { _id: 1 } }
      );
      ok = Boolean(updated);
    }

    if (!ok) {
      await releaseStock(reserved);
      const err = new Error(
        sku ? `Insufficient stock for variant "${sku}"` : "Insufficient stock for one of the items"
      );
      err.statusCode = 409;
      throw err;
    }
    reserved.push({ product: productId, variant: item.variant, qty });
  }

  return reserved;
};

// Best-effort release (used on cancel / stale expiry). Never throws.
export const releaseStock = async (items) => {
  await Promise.allSettled(
    (items || []).map((item) => {
      const productId = item.product?._id || item.product;
      const sku = item.variant?.sku;
      if (sku) {
        return Product.updateOne(
          { _id: productId, "variants.sku": sku },
          { $inc: { "variants.$.stock": item.qty } }
        ).exec();
      }
      return Product.updateOne(
        { _id: productId },
        { $inc: { stock: item.qty, soldCount: -item.qty } }
      ).exec();
    })
  );
};
