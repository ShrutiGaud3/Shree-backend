import { GoogleGenAI } from "@google/genai";
import Product from "../models/productModel.js";
import { STORE_NAME } from "../config/storeConfig.js";

const ai = new GoogleGenAI({});

export const getAnswer = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    res.status(400);
    throw new Error("Please ask a valid question");
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503);
    throw new Error("Shopping assistant is not configured yet");
  }

  // Send only safe, minimal fields for active in-stock products (no PII, no cost data)
  const products = await Product.find({ isActive: true, stock: { $gt: 0 } })
    .select("name category subCategory price stock toysFields.ageGroup jewelleryFields.material")
    .limit(50)
    .lean();

  const prompt = `You are "${STORE_NAME} Assistant", a friendly shopping helper for toys and jewellery at ${STORE_NAME} (India).
Sell ONLY toys and jewellery from the data provided. Never invent products.
Product fields you may use: name, category, price (INR), stock, ageGroup (toys), material (jewellery).
Keep replies to one short friendly sentence with at most one emoji. Include product name and price when recommending.
If nothing matches, reply exactly: "Currently no item available."
User question: ${question}
Catalog: ${JSON.stringify(products)}`;

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    res.status(200).json({ success: true, message: response.text });
  } catch {
    res.status(502);
    throw new Error("Assistant failed to answer. Please try again.");
  }
};
