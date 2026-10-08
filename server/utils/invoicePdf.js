import PDFDocument from "pdfkit";
import { STORE_NAME } from "../config/storeConfig.js";

// WinAnsi-safe (no ₹ glyph in Helvetica) — amounts use "Rs.".
const rs = (n) => `Rs.${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const line = (doc, y) => {
  doc.strokeColor("#EFE7D8").lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();
};

export const renderInvoicePdf = (order, user) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const shortId = String(order._id || "").slice(-8).toUpperCase();
      const addr = order.shippingAddress || {};

      // Header
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#2B2024").text(STORE_NAME);
      doc.font("Helvetica").fontSize(9).fillColor("#6B5B61").text("Toys & Jewellery · support@shree.in · GST invoice included");
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#D6457F").text("TAX INVOICE");
      line(doc, doc.y + 6);
      doc.moveDown(1);

      // Meta
      doc.fontSize(10).fillColor("#2B2024");
      doc.font("Helvetica-Bold").text(`Invoice No: SHREE-${shortId}`);
      const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN");
      doc.font("Helvetica").text(`Order date: ${dateStr}`);
      doc.text(`Order status: ${order.status || "placed"} · Payment: ${order.payment?.method || "cod"} (${order.payment?.status || "pending"})`);
      if (order.couponCode) doc.text(`Coupon applied: ${order.couponCode}`);
      doc.moveDown(0.5);

      // Addresses
      const addrLine = [addr.line1, addr.line2, `${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`, addr.country]
        .filter(Boolean)
        .join(", ");
      doc.font("Helvetica-Bold").text("Bill / Ship To:");
      doc.font("Helvetica").text(`${addr.name || user?.name || "Customer"} · ${addr.phone || ""}`);
      doc.text(addrLine || "—");
      doc.moveDown(0.5);
      line(doc, doc.y + 6);
      doc.moveDown(1);

      // Items table header
      const cols = [40, 250, 320, 380, 460];
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#2B2024");
      doc.text("Item", cols[0], doc.y);
      doc.text("Qty", cols[1], doc.y - 11, { width: 60 });
      doc.text("Unit", cols[2], doc.y - 11, { width: 60 });
      doc.text("GST", cols[3], doc.y - 11, { width: 80 });
      doc.text("Total", cols[4], doc.y - 11, { width: 95 });
      doc.moveDown(0.5);
      line(doc, doc.y + 4);
      doc.moveDown(0.5);

      // Items rows
      doc.font("Helvetica").fontSize(9);
      for (const i of order.items || []) {
        const name = (i.productSnapshot?.name || i.product?.name || "Item").slice(0, 42);
        const qty = Number(i.qty || 1);
        const unitPrice = Number(i.unitPrice || 0);
        const rowY = doc.y;
        doc.text(name, cols[0], rowY, { width: 200 });
        doc.text(String(qty), cols[1], rowY, { width: 60 });
        doc.text(rs(unitPrice), cols[2], rowY, { width: 60 });
        doc.text(rs((i.gstAmount || 0) * qty), cols[3], rowY, { width: 80 });
        doc.text(rs(unitPrice * qty), cols[4], rowY, { width: 95 });
        doc.moveDown(0.6);
      }
      line(doc, doc.y + 4);
      doc.moveDown(1);

      // Totals (right aligned block)
      const totalRows = [
        ["Subtotal", rs(order.subtotal)],
        ["Coupon discount", `-${rs(order.totalDiscount || 0)}`],
        ["GST included", rs(order.totalGst)],
        ["Shipping", order.shippingFee ? rs(order.shippingFee) : "FREE"],
      ];
      if (order.gift?.isGift) totalRows.push(["Gift wrap", rs(order.gift.charge)]);
      for (const [label, val] of totalRows) {
        doc.font("Helvetica").fontSize(10).text(label, 340, doc.y, { width: 120, align: "right" });
        doc.text(val, 460, doc.y - 12, { width: 95, align: "right" });
        doc.moveDown(0.4);
      }
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#D6457F");
      doc.text("Grand Total", 340, doc.y + 4, { width: 120, align: "right" });
      doc.text(rs(order.totalAmount), 460, doc.y - 15, { width: 95, align: "right" });
      doc.fillColor("#2B2024");
      doc.moveDown(1.5);

      if (order.payment?.status === "refunded" || order.payment?.status === "partially_refunded") {
        doc.font("Helvetica").fontSize(9).fillColor("#6B5B61")
          .text(`Refund: ${order.payment.status} ${order.payment.refundAmount ? rs(order.payment.refundAmount) : ""} ${order.payment.refundReason ? `(${order.payment.refundReason})` : ""}`.trim());
        doc.moveDown(0.5);
      }
      if (order.gift?.isGift && order.gift.message) {
        doc.font("Helvetica-Oblique").fontSize(9).fillColor("#6B5B61").text(`Gift message: "${order.gift.message}"`);
        doc.moveDown(0.5);
      }

      doc.font("Helvetica").fontSize(8).fillColor("#6B5B61")
        .text("Thank you for shopping with us! For help, write to support@shree.in. This is a computer-generated invoice.");
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
