// Shree seed script: 1 admin user + 10 toys + 10 jewellery sample products.
// Usage: npm run seed
// Idempotent: re-running replaces the sample products (by SKU) and ensures
// the admin exists (existing admin password is left untouched).

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

dotenv.config();

import User from "./models/userModel.js";
import Product from "./models/productModel.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@shree.in";

// Indian GST reality: toys ~12%, imitation/fashion jewellery ~3% (configurable per product)
const img = (text, bg = "FFAFCC") => ({
  url: `https://placehold.co/600x600/${bg}/4A3426?text=${encodeURIComponent(text)}`,
  alt: text,
  isPrimary: true,
});

const TOYS = [
  {
    name: "Chintu Soft Teddy Bear 60cm",
    description: "Extra-soft plush teddy bear, child-safe stitching, washable. A perfect first cuddly friend for little ones.",
    category: "toys", subCategory: "soft-toys", brand: "Shree Playtime",
    sku: "SHREE-TOY-001", tags: ["soft toy", "teddy", "plush", "gift"],
    mrp: 999, price: 649, stock: 40, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "0-3", safetyCertifications: ["BIS", "EN71"], batteryRequired: false },
    images: [img("Teddy Bear")],
  },
  {
    name: "Guddu Bunny Plush with Bow",
    description: "Long-ear bunny plush in pastel pink with a satin bow. Lightweight and huggable.",
    category: "toys", subCategory: "soft-toys", brand: "Shree Playtime",
    sku: "SHREE-TOY-002", tags: ["soft toy", "bunny", "plush"],
    mrp: 799, price: 499, stock: 35, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "0-3", safetyCertifications: ["BIS"], batteryRequired: false },
    images: [img("Bunny Plush")],
  },
  {
    name: "Sheru Lion Soft Toy",
    description: "Roaring-cute lion plush with embroidered eyes (no small parts). Machine washable.",
    category: "toys", subCategory: "soft-toys", brand: "Shree Playtime",
    sku: "SHREE-TOY-003", tags: ["soft toy", "lion", "plush"],
    mrp: 899, price: 599, stock: 4, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "0-3", safetyCertifications: ["BIS", "EN71"], batteryRequired: false },
    images: [img("Lion Plush")],
  },
  {
    name: "Vyapaar Junior Board Game",
    description: "Classic Indian property-trading board game for family nights. Includes board, currency, tokens and dice.",
    category: "toys", subCategory: "board-games", brand: "Shree Games",
    sku: "SHREE-TOY-004", tags: ["board game", "family", "strategy"],
    mrp: 1299, price: 899, stock: 25, gstRate: 12, isReturnable: true, isFeatured: true,
    toysFields: { ageGroup: "6-12", safetyCertifications: ["BIS"], batteryRequired: false },
    images: [img("Board Game")],
  },
  {
    name: "Shabdkosh Hindi Scrabble-Style Game",
    description: "Build Hindi words and score big. 100 tiles, tile rack and score pad included. Great for ages 6+.",
    category: "toys", subCategory: "board-games", brand: "Shree Games",
    sku: "SHREE-TOY-005", tags: ["board game", "words", "educational", "hindi"],
    mrp: 999, price: 699, stock: 18, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "6-12", safetyCertifications: ["BIS"], batteryRequired: false },
    images: [img("Word Game")],
  },
  {
    name: "Dhoom RC Stunt Car (Rechargeable)",
    description: "2.4GHz remote stunt car with 360° flips, LED lights and USB rechargeable battery.",
    category: "toys", subCategory: "rc-cars", brand: "Shree Wheels",
    sku: "SHREE-TOY-006", tags: ["rc", "car", "stunt", "rechargeable"],
    mrp: 2499, price: 1799, stock: 15, gstRate: 12, isReturnable: true, isFeatured: true,
    toysFields: { ageGroup: "6-12", safetyCertifications: ["BIS"], batteryRequired: true },
    images: [img("RC Car")],
  },
  {
    name: "Chhota Racer RC Buggy",
    description: "Beginner-friendly RC buggy with soft bumpers, 20m range and AA batteries included.",
    category: "toys", subCategory: "rc-cars", brand: "Shree Wheels",
    sku: "SHREE-TOY-007", tags: ["rc", "car", "buggy", "beginner"],
    mrp: 1999, price: 1399, stock: 3, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "3-6", safetyCertifications: ["BIS"], batteryRequired: true },
    images: [img("RC Buggy")],
  },
  {
    name: "Ganit Blocks 100pc Educational Set",
    description: "100 colourful interlocking blocks for counting, shapes and motor skills. Storage box included.",
    category: "toys", subCategory: "educational", brand: "Shree Learn",
    sku: "SHREE-TOY-008", tags: ["blocks", "learning", "stem", "motor skills"],
    mrp: 1499, price: 999, stock: 30, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "3-6", safetyCertifications: ["BIS", "EN71"], batteryRequired: false },
    images: [img("Blocks Set")],
  },
  {
    name: "Tara Science Kit: Volcano & Crystals",
    description: "BIS-safe DIY science kit — erupting volcano, crystal growing and 10 experiments with Hindi+English guide.",
    category: "toys", subCategory: "educational", brand: "Shree Learn",
    sku: "SHREE-TOY-009", tags: ["science", "stem", "diy", "experiment"],
    mrp: 1799, price: 1299, stock: 22, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "6-12", safetyCertifications: ["BIS"], batteryRequired: false },
    images: [img("Science Kit")],
  },
  {
    name: "Akshar Puzzle Mat (Hindi+English)",
    description: "Interlocking foam mat with Hindi varnamala and A-Z. Safe, washable, 36 tiles.",
    category: "toys", subCategory: "educational", brand: "Shree Learn",
    sku: "SHREE-TOY-010", tags: ["puzzle", "mat", "hindi", "alphabet"],
    mrp: 1199, price: 799, stock: 28, gstRate: 12, isReturnable: true,
    toysFields: { ageGroup: "3-6", safetyCertifications: ["BIS", "EN71"], batteryRequired: false },
    images: [img("Puzzle Mat")],
  },
];

const JEWELLERY = [
  {
    name: "Rani Gold-Plated Pearl Necklace Set",
    description: "Elegant gold-plated necklace with faux pearls and matching studs. Perfect for festive occasions.",
    category: "jewellery", subCategory: "necklace", brand: "Shree Shringaar",
    sku: "SHREE-JWL-001", tags: ["necklace", "pearl", "gold-plated", "festive"],
    mrp: 2999, price: 1999, stock: 12, gstRate: 3, isReturnable: false, isFeatured: true,
    jewelleryFields: { material: "gold-plated", purity: "Gold-plated", stoneType: "Faux Pearl", weightGrams: 45, careInstructions: "Keep away from perfume and water. Wipe with a soft dry cloth." },
    images: [img("Pearl Necklace", "D0A375")],
  },
  {
    name: "Meena Kundan Choker Necklace",
    description: "Traditional kundan choker with meenakari detailing. Pairs beautifully with sarees and lehengas.",
    category: "jewellery", subCategory: "necklace", brand: "Shree Shringaar",
    sku: "SHREE-JWL-002", tags: ["necklace", "kundan", "choker", "bridal"],
    mrp: 4999, price: 3499, stock: 8, gstRate: 3, isReturnable: false,
    jewelleryFields: { material: "artificial", purity: "N/A", stoneType: "Kundan", weightGrams: 120, careInstructions: "Store in the pouch provided. Avoid moisture." },
    images: [img("Kundan Choker", "D0A375")],
  },
  {
    name: "Chandbali Silver-925 Jhumka Earrings",
    description: "Classic chandbali jhumkas in 925 sterling silver with oxidized finish.",
    category: "jewellery", subCategory: "earrings", brand: "Shree Shringaar",
    sku: "SHREE-JWL-003", tags: ["earrings", "jhumka", "silver", "chandbali"],
    mrp: 2499, price: 1799, stock: 20, gstRate: 3, isReturnable: false,
    jewelleryFields: { material: "silver-925", purity: "925", stoneType: "None", weightGrams: 18, hallmarkNumber: "925-SHREE", careInstructions: "Polish with a silver cloth. Keep in an airtight box." },
    images: [img("Silver Jhumka", "D0A375")],
  },
  {
    name: "Gulnaar Rose-Gold Stud Earrings",
    description: "Everyday rose-gold-plated studs with American diamonds. Hypoallergenic push-backs.",
    category: "jewellery", subCategory: "earrings", brand: "Shree Shringaar",
    sku: "SHREE-JWL-004", tags: ["earrings", "studs", "rose gold", "daily wear"],
    mrp: 1499, price: 999, stock: 30, gstRate: 3, isReturnable: false, isFeatured: true,
    jewelleryFields: { material: "rose-gold-plated", purity: "Rose-gold plated", stoneType: "American Diamond", weightGrams: 6, careInstructions: "Wipe after wear. Avoid contact with water." },
    images: [img("Stud Earrings", "D0A375")],
  },
  {
    name: "Bandhan Gold-Plated Couple Rings (Set of 2)",
    description: "Matching gold-plated bands with engraved pattern. Sizes adjustable.",
    category: "jewellery", subCategory: "rings", brand: "Shree Shringaar",
    sku: "SHREE-JWL-005", tags: ["rings", "couple", "bands", "gold-plated"],
    mrp: 1999, price: 1299, stock: 16, gstRate: 3, isReturnable: false,
    variants: [
      { label: "Size 12", sku: "SHREE-JWL-005-S12", price: 1299, stock: 8 },
      { label: "Size 14", sku: "SHREE-JWL-005-S14", price: 1299, stock: 8 },
    ],
    jewelleryFields: { material: "gold-plated", purity: "Gold-plated", stoneType: "None", weightGrams: 10, careInstructions: "Remove before washing hands." },
    images: [img("Couple Rings", "D0A375")],
  },
  {
    name: "Neelam American Diamond Ring",
    description: "Statement solitaire-style ring with a sky-blue American diamond on a silver-925 band.",
    category: "jewellery", subCategory: "rings", brand: "Shree Shringaar",
    sku: "SHREE-JWL-006", tags: ["ring", "solitaire", "american diamond", "silver"],
    mrp: 2999, price: 2199, stock: 10, gstRate: 3, isReturnable: false,
    jewelleryFields: { material: "silver-925", purity: "925", stoneType: "American Diamond", weightGrams: 8, hallmarkNumber: "925-SHREE", careInstructions: "Clean gently with a soft brush." },
    images: [img("AD Ring", "D0A375")],
  },
  {
    name: "Suhagan Red-Gold Bangle Set (4pc)",
    description: "Set of 4 festive bangles in red enamel with gold-plated kadas. Sizes 2.4/2.6/2.8.",
    category: "jewellery", subCategory: "bangles", brand: "Shree Shringaar",
    sku: "SHREE-JWL-007", tags: ["bangles", "kadas", "festive", "enamel"],
    mrp: 1799, price: 1199, stock: 14, gstRate: 3, isReturnable: false,
    variants: [
      { label: "Size 2.4", sku: "SHREE-JWL-007-24", price: 1199, stock: 5 },
      { label: "Size 2.6", sku: "SHREE-JWL-007-26", price: 1199, stock: 5 },
      { label: "Size 2.8", sku: "SHREE-JWL-007-28", price: 1199, stock: 4 },
    ],
    jewelleryFields: { material: "gold-plated", purity: "Gold-plated", stoneType: "None", weightGrams: 60, careInstructions: "Keep away from hard surfaces to protect enamel." },
    images: [img("Bangle Set", "D0A375")],
  },
  {
    name: "Payal Silver-925 Anklet Pair with Ghungroo",
    description: "Traditional ghungroo anklets in 925 silver. Sweet sound, sturdy links.",
    category: "jewellery", subCategory: "anklets", brand: "Shree Shringaar",
    sku: "SHREE-JWL-008", tags: ["anklets", "payal", "silver", "ghungroo"],
    mrp: 3499, price: 2599, stock: 9, gstRate: 3, isReturnable: false,
    jewelleryFields: { material: "silver-925", purity: "925", stoneType: "None", weightGrams: 42, hallmarkNumber: "925-SHREE", careInstructions: "Dry fully after contact with water." },
    images: [img("Payal Anklets", "D0A375")],
  },
  {
    name: "Morni Oxidised Anklet Pair",
    description: "Boho oxidised anklets with peacock charms. Lightweight daily wear.",
    category: "jewellery", subCategory: "anklets", brand: "Shree Shringaar",
    sku: "SHREE-JWL-009", tags: ["anklets", "oxidised", "boho", "daily wear"],
    mrp: 999, price: 649, stock: 25, gstRate: 3, isReturnable: false,
    jewelleryFields: { material: "artificial", purity: "N/A", stoneType: "None", weightGrams: 20, careInstructions: "Keep dry. Store flat to avoid tangling." },
    images: [img("Boho Anklets", "D0A375")],
  },
  {
    name: "Kamarbandh Gold-Plated Waist Chain",
    description: "Delicate gold-plated waist chain with coin drops. Adjustable length.",
    category: "jewellery", subCategory: "bangles", brand: "Shree Shringaar",
    sku: "SHREE-JWL-010", tags: ["kamarbandh", "waist chain", "bridal", "gold-plated"],
    mrp: 2799, price: 1899, stock: 2, gstRate: 3, isReturnable: false,
    jewelleryFields: { material: "gold-plated", purity: "Gold-plated", stoneType: "None", weightGrams: 55, careInstructions: "Handle the drops gently. Store flat." },
    images: [img("Waist Chain", "D0A375")],
  },
];

const seed = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected: ${mongoose.connection.name}`);

  // --- Admin user (never overwrite an existing password) ---
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    const password = process.env.SEED_ADMIN_PASSWORD || "Shree@12345";
    const salt = await bcrypt.genSalt(10);
    admin = await User.create({
      name: "Shree Admin",
      email: ADMIN_EMAIL,
      phone: process.env.SEED_ADMIN_PHONE || "9876543210",
      password: await bcrypt.hash(password, salt),
      isAdmin: true,
    });
    console.log(`Admin created: ${ADMIN_EMAIL} (password: ${process.env.SEED_ADMIN_PASSWORD ? "from SEED_ADMIN_PASSWORD" : "Shree@12345 — change it!"})`);
  } else {
    if (!admin.isAdmin) {
      admin.isAdmin = true;
      await admin.save();
    }
    console.log(`Admin already exists: ${ADMIN_EMAIL} (password untouched)`);
  }

  // --- Sample products (idempotent by SKU) ---
  const samples = [...TOYS, ...JEWELLERY];
  const skus = samples.map((p) => p.sku);
  await Product.deleteMany({ sku: { $in: skus } });
  const created = await Product.insertMany(samples);
  const toys = created.filter((p) => p.category === "toys").length;
  const jewel = created.filter((p) => p.category === "jewellery").length;
  console.log(`Products seeded: ${created.length} (toys: ${toys}, jewellery: ${jewel})`);

  await mongoose.disconnect();
  console.log("Seed complete.");
};

export { TOYS, JEWELLERY };

// Only auto-run when executed directly (`node server/seed.js`), so the
// sample data can be imported for validation without touching the DB.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().catch(async (error) => {
    console.error(`Seed failed: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch { /* noop */ }
    process.exit(1);
  });
}
