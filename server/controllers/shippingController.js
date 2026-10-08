import { getStoreSettings } from "../utils/storeSettings.js";

// Stateless pincode serviceability check (single-vendor ships pan-India).
// All computation happens on the server from STORE_CONFIG — no mock data.
// Zone is derived from the first digit (India Post convention) for a
// realistic ETA band; every valid 6-digit code is serviceable.
const ZONE_BY_FIRST_DIGIT = {
  1: "North",
  2: "North",
  3: "West",
  4: "West",
  5: "South",
  6: "South",
  7: "East",
  8: "East",
  9: "Defence / Remote",
};

const ETA_BY_ZONE = {
  North: { minDays: 3, maxDays: 5 },
  West: { minDays: 2, maxDays: 4 },
  South: { minDays: 3, maxDays: 6 },
  East: { minDays: 4, maxDays: 7 },
  "Defence / Remote": { minDays: 5, maxDays: 9 },
};

export const checkPincode = async (req, res) => {
  const { pincode } = req.params;
  const settings = await getStoreSettings();
  const zone = ZONE_BY_FIRST_DIGIT[pincode[0]] || "North";
  const eta = ETA_BY_ZONE[zone] || { minDays: 3, maxDays: 7 };

  res.status(200).json({
    pincode,
    serviceable: true,
    zone,
    dispatchInHours: "24-48",
    etaMinDays: eta.minDays,
    etaMaxDays: eta.maxDays,
    codAvailable: true,
    freeShippingThreshold: settings.freeShippingThreshold,
    shippingFee: settings.shippingFee,
    message: `Delivery to ${pincode} (${zone} zone) in ${eta.minDays}-${eta.maxDays} working days.`,
  });
};

const shippingController = { checkPincode };

export default shippingController;
