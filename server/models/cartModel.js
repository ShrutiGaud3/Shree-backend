import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variant: {
          // Variant details if a variant was selected
          sku: { type: String },
          label: { type: String },
          attributes: { type: Map, of: String },
          price: { type: Number },
        },
        qty: {
          type: Number,
          required: true,
          min: [1, "Quantity cannot be less than 1"],
          default: 1,
        },
        // Price snapshot for display
        priceSnapshot: {
          type: Number,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// unique:true on user already creates the index — no extra index needed

// Virtual: total items count
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

// Virtual: subtotal
cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => {
    const price = item.variant?.price || item.priceSnapshot || 0;
    return sum + price * item.qty;
  }, 0);
});

// Ensure virtuals
cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;