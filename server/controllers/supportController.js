import SupportMessage from "../models/supportModel.js";

// Public: contact-form submit (no auth needed)
const createMessage = async (req, res) => {
  const msg = await SupportMessage.create(req.body);
  res.status(201).json({ message: "Message received! We reply within 4 working hours. 💌", _id: msg._id });
};

// Admin: inbox, optional ?status= filter
const getMessagesAdmin = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const msgs = await SupportMessage.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.status(200).json(msgs || []);
};

// Admin: status change and/or reply (reply stamps author + time, flips to replied)
const updateMessageAdmin = async (req, res) => {
  const msg = await SupportMessage.findById(req.params.mid);
  if (!msg) {
    res.status(404);
    throw new Error("Message not found");
  }
  if (req.body.status) msg.status = req.body.status;
  if (req.body.adminReply) {
    msg.adminReply = { text: req.body.adminReply, repliedAt: new Date(), repliedBy: req.user._id };
    if (msg.status !== "closed") msg.status = "replied";
  }
  await msg.save();
  res.status(200).json(msg);
};

const supportController = { createMessage, getMessagesAdmin, updateMessageAdmin };

export default supportController;
