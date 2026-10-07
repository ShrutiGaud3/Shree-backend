// Category and subcategory constants for Shree store
// Single source of truth for all category-related logic

export const CATEGORIES = {
  toys: {
    label: "Toys",
    subCategories: {
      "soft-toys": "Soft Toys",
      "board-games": "Board Games",
      "rc-cars": "RC Cars",
      educational: "Educational",
    },
    // Toys-specific fields
    specificFields: [
      "ageGroup",
      "safetyCertifications",
      "batteryRequired",
    ],
  },
  jewellery: {
    label: "Jewellery",
    subCategories: {
      necklace: "Necklace",
      earrings: "Earrings",
      rings: "Rings",
      bangles: "Bangles",
      anklets: "Anklets",
    },
    // Jewellery-specific fields
    specificFields: [
      "material",
      "purity",
      "stoneType",
      "weightGrams",
      "hallmarkNumber",
      "careInstructions",
    ],
  },
};

// Flattened arrays for easy validation
export const TOP_LEVEL_CATEGORIES = Object.keys(CATEGORIES); // ["toys", "jewellery"]

export const ALL_SUB_CATEGORIES = Object.values(CATEGORIES).flatMap(
  (cat) => Object.keys(cat.subCategories)
); // ["soft-toys", "board-games", "rc-cars", "educational", "necklace", "earrings", "rings", "bangles", "anklets"]

// Helper to get subcategories for a category
export const getSubCategories = (category) => {
  return CATEGORIES[category]?.subCategories || {};
};

// Helper to check if a subcategory belongs to a category
export const isValidSubCategory = (category, subCategory) => {
  const subcats = getSubCategories(category);
  return subCategory in subcats;
};

// Helper to get all valid category/subcategory pairs
export const getAllCategoryPairs = () => {
  const pairs = [];
  for (const [cat, data] of Object.entries(CATEGORIES)) {
    for (const subcat of Object.keys(data.subCategories)) {
      pairs.push({ category: cat, subCategory: subcat });
    }
  }
  return pairs;
};

// Category-specific field validation
export const getCategorySpecificFields = (category) => {
  return CATEGORIES[category]?.specificFields || [];
};

// Check if a field is valid for a category
export const isFieldValidForCategory = (category, field) => {
  const fields = getCategorySpecificFields(category);
  return fields.includes(field);
};