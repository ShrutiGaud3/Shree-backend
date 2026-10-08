import Setting from "../models/settingModel.js";
import { STORE_CONFIG } from "../config/storeConfig.js";
import { invalidateStoreSettings } from "../utils/storeSettings.js";

// Admin: effective config (static defaults + DB overrides)
const getSettingsAdmin = async (req, res) => {
  const rows = await Setting.find({}).lean();
  const overrides = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
  res.status(200).json({ defaults: STORE_CONFIG, overrides, effective: { ...STORE_CONFIG, ...overrides } });
};

const updateSettingsAdmin = async (req, res) => {
  const entries = Object.entries(req.body || {});
  for (const [key, value] of entries) {
    await Setting.findOneAndUpdate(
      { key },
      { $set: { value, updatedBy: req.user._id } },
      { upsert: true, runValidators: true }
    ).exec();
  }
  invalidateStoreSettings();
  const rows = await Setting.find({}).lean();
  const overrides = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
  res.status(200).json({ overrides, effective: { ...STORE_CONFIG, ...overrides } });
};

const settingsController = { getSettingsAdmin, updateSettingsAdmin };

export default settingsController;
