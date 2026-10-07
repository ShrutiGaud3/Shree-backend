export const STORE_NAME = "Shree";

export const STORE_CONFIG = {
  // Free shipping above this amount (in INR)
  freeShippingThreshold: 999,

  // Flat shipping fee when order is below threshold (in INR)
  shippingFee: 99,

  // COD allowed only below this order value (in INR)
  // High-value jewellery orders must be prepaid online
  codMaxOrderValue: 5000,

  // Default GST rate (percentage) - can be overridden per product
  defaultGstRate: 18,

  // Order status transition map
  orderStatusTransitions: {
    placed: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered", "returned"],
    delivered: ["returned", "completed"],
    cancelled: [],
    returned: ["refunded", "rejected"],
    refunded: [],
    completed: [],
  },

  // Auto-cancel stale orders after this many minutes
  staleOrderMinutes: 30,

  // Pagination defaults
  defaultPage: 1,
  defaultLimit: 12,
  maxLimit: 50,
};

export const STORE_CONTACT = {
  email: "support@shree.in",
  phone: "+91-XXXXXXXXXX",
  address: "Shree Toys & Jewellery, India",
};