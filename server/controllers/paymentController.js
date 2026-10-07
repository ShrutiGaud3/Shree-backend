import Order from "../models/orderModel.js";
import { verifyCheckoutSignature, verifyWebhookSignature } from "../utils/razorpay.js";
import { notifyOrderStatus } from "../utils/orderEmails.js";
import logger from "../utils/logger.js";

// POST /api/payments/verify — called after Razorpay checkout succeeds.
// Body: { orderId (mongo), razorpayOrderId, razorpayPaymentId, razorpaySignature }
const verifyPayment = async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order Not Found!");
  }

  if (order.payment.method !== "razorpay") {
    res.status(400);
    throw new Error("This order is not a prepaid online order");
  }

  // Idempotent: already verified (e.g., webhook got there first)
  if (order.payment.status === "paid") {
    return res.status(200).json(order);
  }

  if (order.status !== "placed" || order.payment.status !== "pending") {
    res.status(409);
    throw new Error("Order is no longer payable (expired or cancelled)");
  }

  if (order.payment.razorpayOrderId !== razorpayOrderId) {
    res.status(400);
    throw new Error("Payment order mismatch");
  }

  const valid = verifyCheckoutSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!valid) {
    order.payment.status = "failed";
    await order.save();
    res.status(400);
    throw new Error("Payment signature verification failed");
  }

  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.razorpaySignature = razorpaySignature;
  order.payment.status = "paid";
  order._updatedBy = req.user._id;
  order.status = "confirmed";
  await order.save();
  notifyOrderStatus(order._id);

  res.status(200).json(order);
};

// POST /api/payments/webhook — Razorpay server-to-server events. No auth;
// authenticity comes from the x-razorpay-signature header over the RAW body.
// NOTE: server.js mounts express.raw() on this path before express.json().
const webhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.body; // Buffer (express.raw)

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn("Rejected Razorpay webhook with bad signature");
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  try {
    const entity = event.payload?.payment?.entity;
    if (entity?.order_id) {
      const order = await Order.findOne({ "payment.razorpayOrderId": entity.order_id });

      if (order && order.payment.method === "razorpay") {
        if (event.event === "payment.captured" && order.payment.status !== "paid") {
          order.payment.razorpayPaymentId = entity.id;
          order.payment.status = "paid";
          if (order.status === "placed") order.status = "confirmed";
          await order.save();
          notifyOrderStatus(order._id);
        } else if (event.event === "payment.failed" && order.payment.status === "pending") {
          order.payment.status = "failed";
          await order.save();
        }
      }
    }
  } catch (error) {
    logger.error({ err: error.message }, "Razorpay webhook handling failed");
    // Still ack — Razorpay retries; stale-order job cleans up unpaid orders.
  }

  res.status(200).json({ success: true });
};

// GET /api/payments/key — publishable key for Razorpay checkout.js
const getKey = async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    res.status(503);
    throw new Error("Online payments are not configured");
  }
  res.status(200).json({ keyId: process.env.RAZORPAY_KEY_ID });
};

const paymentController = { verifyPayment, webhook, getKey };

export default paymentController;
