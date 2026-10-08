import Order from "../models/orderModel.js";
import { renderInvoicePdf } from "../utils/invoicePdf.js";

const filenameOf = (order) => `SHREE-${String(order._id).slice(-8).toUpperCase()}.pdf`;

const streamInvoice = async (res, order, user) => {
  try {
    const pdf = await renderInvoicePdf(order, user || {});
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filenameOf(order)}"`);
    res.setHeader("Content-Length", pdf.length);
    res.status(200).send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate invoice PDF" });
  }
};

// Admin: any order
const adminInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.oid).populate("user", "name email").lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    await streamInvoice(res, order, order.user);
  } catch (err) {
    next(err);
  }
};

// Customer: own orders only
const myInvoice = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.oid, user: req.user._id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    await streamInvoice(res, order, req.user);
  } catch (err) {
    next(err);
  }
};

const invoiceController = { adminInvoice, myInvoice };

export default invoiceController;
