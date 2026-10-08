import NewsletterSubscriber from "../models/newsletterModel.js";

// Public: idempotent subscribe (repeat signups return success, never 409)
const subscribe = async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const existing = await NewsletterSubscriber.findOne({ email }).lean();
  if (existing) {
    if (!existing.isActive) {
      await NewsletterSubscriber.updateOne({ email }, { $set: { isActive: true } }).exec();
    }
    return res.status(200).json({ subscribed: true, message: "You're on the list! 💌" });
  }
  await NewsletterSubscriber.create({ email, source: req.body.source || "footer" });
  res.status(201).json({ subscribed: true, message: "Welcome aboard! Check your inbox soon. 💌" });
};

// Admin: full subscriber list
const getSubscribersAdmin = async (req, res) => {
  const subs = await NewsletterSubscriber.find().sort({ createdAt: -1 }).lean();
  res.status(200).json(subs || []);
};

const newsletterController = { subscribe, getSubscribersAdmin };

export default newsletterController;
