// Brand-styled order emails (Shree palette, inline styles for email clients).
// Fire-and-forget: every entry point catches internally and never throws.

import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import { STORE_NAME } from "../config/storeConfig.js";
import { BRAND } from "../config/brand.js";
import { sendEmail } from "./sendEmail.js";
import logger from "./logger.js";

const money = (n) => `₹${Number(n || 0).toFixed(2)}`;

const layout = ({ heading, body }) => `
<div style="background-color:${BRAND.bg};padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
  <div style="max-width:560px;margin:0 auto;background-color:${BRAND.surface};border:2px solid ${BRAND.accent};border-radius:16px;overflow:hidden;">
    <div style="background-color:${BRAND.primary};padding:20px 24px;text-align:center;">
      <div style="font-size:28px;font-weight:bold;color:${BRAND.text};">${STORE_NAME}</div>
      <div style="font-size:13px;color:${BRAND.text};">Toys &amp; Jewellery</div>
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 12px;color:${BRAND.text};">${heading}</h2>
      ${body}
    </div>
    <div style="padding:16px 24px;border-top:1px solid ${BRAND.accent};font-size:12px;color:${BRAND.textMuted};">
      Need help? Reply to this email or contact ${STORE_NAME} support.<br/>Please do not share OTPs or passwords with anyone.
    </div>
  </div>
</div>`;

const itemsTable = (order) =>
  `<table style="width:100%;border-collapse:collapse;margin:12px 0;">
    <thead><tr>
      <th align="left" style="border-bottom:1px solid ${BRAND.accent};padding:6px;">Item</th>
      <th align="right" style="border-bottom:1px solid ${BRAND.accent};padding:6px;">Qty</th>
      <th align="right" style="border-bottom:1px solid ${BRAND.accent};padding:6px;">Amount</th>
    </tr></thead>
    <tbody>${(order.items || [])
      .map(
        (i) => `<tr>
          <td style="padding:6px 6px 6px 0;">${i.productSnapshot?.name || "Item"}${i.variant?.label ? ` <span style="color:${BRAND.textMuted};">(${i.variant.label})</span>` : ""}</td>
          <td align="right" style="padding:6px;">${i.qty}</td>
          <td align="right" style="padding:6px;">${money(i.unitPrice * i.qty)}</td>
        </tr>`
      )
      .join("")}</tbody>
  </table>
  <p style="margin:4px 0;">Subtotal: <b>${money(order.subtotal)}</b></p>
  ${order.totalDiscount ? `<p style="margin:4px 0;">Discount${order.couponCode ? ` (${order.couponCode})` : ""}: <b>−${money(order.totalDiscount)}</b></p>` : ""}
  <p style="margin:4px 0;">GST: <b>${money(order.totalGst)}</b> &nbsp; Shipping: <b>${order.shippingFee ? money(order.shippingFee) : "FREE"}</b></p>
  <p style="margin:8px 0;font-size:18px;">Total: <b>${money(order.totalAmount)}</b></p>`;

const STATUS_COPY = {
  placed: { subject: "Order placed!", heading: "Thank you for your order!" },
  confirmed: { subject: "Payment confirmed!", heading: "Payment received!" },
  processing: { subject: "Order update: packing", heading: "We're packing your order" },
  shipped: { subject: "Order update: shipped", heading: "Your order is on its way!" },
  delivered: { subject: "Order update: delivered", heading: "Delivered — enjoy!" },
  cancelled: { subject: "Order update: cancelled", heading: "Your order was cancelled" },
  returned: { subject: "Order update: return received", heading: "We've received your return" },
  refunded: { subject: "Order update: refunded", heading: "Your refund is processed" },
  completed: { subject: "Order update: completed", heading: "Order completed — thank you!" },
};

const trackingBlock = (order) =>
  order.trackingNumber
    ? `<p style="margin:8px 0;">Tracking ID: <b>${order.trackingNumber}</b>${order.trackingUrl ? ` (<a href="${order.trackingUrl}" style="color:${BRAND.text};">track</a>)` : ""}</p>`
    : "";

export const orderStatusEmail = async (order, user) => {
  try {
    const to = user?.email;
    if (!to || !order) return false;
    const copy = STATUS_COPY[order.status] || { subject: "Order update", heading: "An update on your order" };
    const payNote =
      order.payment?.method === "cod"
        ? `<p style="margin:8px 0;">Payment mode: <b>Cash on Delivery</b> — please keep ${money(order.totalAmount)} ready.</p>`
        : `<p style="margin:8px 0;">Payment mode: <b>Prepaid online</b> (${order.payment?.status || "pending"}).</p>`;
    const html = layout({
      heading: `${copy.heading} (#${String(order._id).slice(-8).toUpperCase()})`,
      body: `${itemsTable(order)}${trackingBlock(order)}${payNote}`,
    });
    return await sendEmail({
      to,
      subject: `${copy.subject} #${String(order._id).slice(-8).toUpperCase()}`,
      text: `${STORE_NAME}: ${copy.heading} Order total ${money(order.totalAmount)}.`,
      html,
    });
  } catch (error) {
    logger.error({ err: error.message }, "orderStatusEmail failed");
    return false;
  }
};

// Convenience: load order + buyer and notify current status. Never throws.
export const notifyOrderStatus = async (orderId) => {
  try {
    const order = await Order.findById(orderId).lean();
    if (!order) return false;
    const user = await User.findById(order.user).select("email name").lean();
    return await orderStatusEmail(order, user);
  } catch (error) {
    logger.error({ err: error.message }, "notifyOrderStatus failed");
    return false;
  }
};

export const passwordResetEmail = async (user, resetLink) => {
  const html = layout({
    heading: "Reset your password",
    body: `<p>Hi ${user.name || "there"}, tap the button below to set a new password. This link expires in 30 minutes.</p>
      <p style="margin:20px 0;"><a href="${resetLink}" style="display:inline-block;background-color:${BRAND.primary};color:${BRAND.text};font-weight:bold;padding:12px 28px;border-radius:999px;text-decoration:none;">Reset password</a></p>
      <p style="font-size:12px;color:${BRAND.textMuted};">If you didn't ask for this, you can safely ignore this email.</p>`,
  });
  return sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `${STORE_NAME}: reset your password here (expires in 30 minutes): ${resetLink}`,
    html,
  });
};
