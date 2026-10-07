// Razorpay client singleton + signature helpers.
// All amounts Razorpay-side are in paise (INR x 100).

import crypto from "node:crypto";
import Razorpay from "razorpay";

let client = null;

export const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    const err = new Error("Online payments are not configured");
    err.statusCode = 503;
    throw err;
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

// Server creates the Razorpay order (amount in paise). Never trust client totals.
export const createRazorpayOrder = async ({ amountInr, receipt }) => {
  const rzp = getRazorpayClient();
  return rzp.orders.create({
    amount: Math.round(amountInr * 100),
    currency: "INR",
    receipt: receipt.slice(0, 40),
  });
};

// Checkout verify: HMAC_SHA256(order_id|payment_id, key_secret) === signature
export const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
};

// Webhook verify: HMAC_SHA256(rawBody, webhook_secret) === x-razorpay-signature
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
};

export const refundRazorpayPayment = async (paymentId, amountInr) => {
  const rzp = getRazorpayClient();
  return rzp.payments.refund(paymentId, {
    amount: Math.round(amountInr * 100),
    speed: "normal",
  });
};
