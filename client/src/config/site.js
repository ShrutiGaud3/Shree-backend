// Frontend single source of truth for store identity + catalog taxonomy.
// Backend mirror: server/config/storeConfig.js + server/config/categories.js

export const STORE_NAME = "Shree";
export const STORE_TITLE = "Shree | Toys & Jewellery";
export const STORE_TAGLINE = "Toys that spark joy, jewellery that shines.";

export const API_BASE = "/api"; // vite proxies /api -> backend (see vite.config.js)
export const RAZORPAY_THEME_COLOR = "#FFAFCC"; // brand primary (checkout.js needs hex)

export const CATEGORIES = {
  toys: {
    label: "Toys",
    blurb: "Playtime favourites for every age",
    subCategories: {
      "soft-toys": "Soft Toys",
      "board-games": "Board Games",
      "rc-cars": "RC Cars",
      educational: "Educational",
    },
  },
  jewellery: {
    label: "Jewellery",
    blurb: "Everyday elegance & festive sparkle",
    subCategories: {
      necklace: "Necklace",
      earrings: "Earrings",
      rings: "Rings",
      bangles: "Bangles",
      anklets: "Anklets",
    },
  },
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

// Order status timeline (subset of backend transition map, in journey order)
export const ORDER_TIMELINE = ["placed", "confirmed", "processing", "shipped", "delivered", "completed"];
export const TERMINAL_STATUS = ["cancelled", "returned", "refunded", "rejected"];
