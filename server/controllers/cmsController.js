import CmsBlock from "../models/cmsBlockModel.js";

// Public: active + date-valid blocks, optional ?section= filter, sorted.
const getBlocks = async (req, res) => {
  const now = new Date();
  const filter = { isActive: true };
  if (req.query.section) filter.section = req.query.section;
  filter.$and = [
    { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
    { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] },
  ];

  const blocks = await CmsBlock.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.status(200).json(blocks || []);
};

// Admin: everything, newest first
const getBlocksAdmin = async (req, res) => {
  const blocks = await CmsBlock.find().sort({ createdAt: -1 }).lean();
  res.status(200).json(blocks || []);
};

const createBlock = async (req, res) => {
  const block = await CmsBlock.create(req.body);
  res.status(201).json(block);
};

const updateBlock = async (req, res) => {
  const updated = await CmsBlock.findByIdAndUpdate(req.params.bid, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    res.status(404);
    throw new Error("Content block not found");
  }
  res.status(200).json(updated);
};

const deleteBlock = async (req, res) => {
  const deleted = await CmsBlock.findByIdAndDelete(req.params.bid);
  if (!deleted) {
    res.status(404);
    throw new Error("Content block not found");
  }
  res.status(200).json({ message: "Content block deleted", _id: req.params.bid });
};

const cmsController = { getBlocks, getBlocksAdmin, createBlock, updateBlock, deleteBlock };

export default cmsController;
