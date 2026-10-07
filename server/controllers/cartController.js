import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";

const populateCart = (cart) => cart.populate("items.product");

const getCart = async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    return res.status(200).json({ user: userId, items: [] });
  }

  res.status(200).json(cart);
};

const addToCart = async (req, res) => {
  const { productId, qty = 1, variantSku } = req.body;
  const userId = req.user._id;

  if (!productId) {
    res.status(400);
    throw new Error("Product id is required");
  }

  const quantity = parseInt(qty, 10);
  if (!Number.isInteger(quantity) || quantity < 1) {
    res.status(400);
    throw new Error("Quantity must be a positive integer");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    res.status(404);
    throw new Error("Product Not Found!");
  }

  // Resolve available stock (variant-aware)
  let availableStock = product.stock;
  let variantSnapshot = undefined;
  if (product.variants?.length > 0) {
    if (!variantSku) {
      res.status(400);
      throw new Error("Variant selection is required for this product");
    }
    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant) {
      res.status(404);
      throw new Error("Variant not found");
    }
    availableStock = variant.stock;
    variantSnapshot = { sku: variant.sku, label: variant.label, price: variant.price };
  }

  if (availableStock < quantity) {
    res.status(400);
    throw new Error("Insufficient Stock");
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [{ product: productId, qty: quantity, variant: variantSnapshot }],
    });
  } else {
    const idx = cart.items.findIndex(
      (item) => item.product.toString() === productId && (item.variant?.sku || "") === (variantSku || "")
    );
    if (idx > -1) {
      cart.items[idx].qty += quantity;
      if (cart.items[idx].qty > availableStock) {
        res.status(400);
        throw new Error("Quantity exceeds available stock");
      }
    } else {
      cart.items.push({ product: productId, qty: quantity, variant: variantSnapshot });
    }
  }

  await cart.save();
  await populateCart(cart);

  res.status(200).json(cart);
};

const updateCart = async (req, res) => {
  const { productId, qty, variantSku } = req.body;
  const userId = req.user._id;

  const quantity = parseInt(qty, 10);
  if (!Number.isInteger(quantity) || quantity < 1) {
    res.status(400);
    throw new Error("Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  const idx = cart.items.findIndex(
    (item) => item.product.toString() === productId && (item.variant?.sku || "") === (variantSku || "")
  );
  if (idx === -1) {
    res.status(404);
    throw new Error("Product not found in cart");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error("Product not found");
  }

  let availableStock = product.stock;
  if (product.variants?.length > 0) {
    const variant = product.variants.find((v) => v.sku === (variantSku || cart.items[idx].variant?.sku));
    if (!variant) {
      res.status(404);
      throw new Error("Variant not found");
    }
    availableStock = variant.stock;
  }

  if (quantity > availableStock) {
    res.status(400);
    throw new Error("Quantity exceeds available stock");
  }

  cart.items[idx].qty = quantity;
  await cart.save();
  await populateCart(cart);

  res.status(200).json(cart);
};

const removeCart = async (req, res) => {
  const { productId } = req.params;
  const { variantSku } = req.query;
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => !(item.product.toString() === productId && (item.variant?.sku || "") === (variantSku || ""))
  );

  await cart.save();
  await populateCart(cart);

  res.status(200).json(cart);
};

const clearCart = async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    res.status(404);
    throw new Error("Cart Not Found!");
  }

  cart.items = [];
  await cart.save();

  res.status(200).json(cart);
};

const cartController = { addToCart, updateCart, removeCart, getCart, clearCart };

export default cartController;
