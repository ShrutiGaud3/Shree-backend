// Stale-order cleanup: unpaid prepaid (Razorpay) orders past
// STORE_CONFIG.staleOrderMinutes are auto-cancelled and their reserved
// stock is released. COD orders are never touched here.
// Runs in-process on an interval; for multi-instance deployments move to
// a distributed lock / agenda-style scheduler (noted, not built).

import Order from "../models/orderModel.js";
import { STORE_CONFIG } from "../config/storeConfig.js";
import { cancelOrderAndRelease } from "./orderService.js";
import logger from "./logger.js";

const BATCH_LIMIT = 50;

export const cancelStaleOrders = async () => {
  const cutoff = new Date(Date.now() - STORE_CONFIG.staleOrderMinutes * 60 * 1000);

  const stale = await Order.find({
    status: "placed",
    "payment.method": "razorpay",
    "payment.status": "pending",
    createdAt: { $lt: cutoff },
  })
    .limit(BATCH_LIMIT)
    .select("_id");

  let cancelled = 0;
  for (const { _id } of stale) {
    try {
      const order = await Order.findById(_id);
      if (!order) continue;
      await cancelOrderAndRelease(order, { reason: "Payment timeout — auto-cancelled" });
      cancelled += 1;
    } catch (error) {
      logger.error({ orderId: _id, err: error.message }, "Stale-order cancel failed");
    }
  }

  if (cancelled) logger.info({ cancelled }, "Stale unpaid orders auto-cancelled");
  return cancelled;
};

export const startStaleOrderJob = () => {
  const everyMs = Math.min(5 * 60 * 1000, STORE_CONFIG.staleOrderMinutes * 60 * 1000);
  const timer = setInterval(() => {
    cancelStaleOrders().catch((error) => logger.error({ err: error.message }, "Stale-order job failed"));
  }, everyMs);
  // Don't keep the process alive just for this timer (tests / scripts)
  timer.unref?.();
  logger.info({ everyMs, staleMinutes: STORE_CONFIG.staleOrderMinutes }, "Stale-order job started");
  return timer;
};
