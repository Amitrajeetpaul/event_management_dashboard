import mongoose from "mongoose";

const orderLineSchema = new mongoose.Schema(
  {
    tier: { type: mongoose.Schema.Types.ObjectId, ref: "TicketTier", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    lines: [orderLineSchema],
    subtotal: { type: Number, required: true },
    fee: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    paymentMethod: { type: String, default: "card" },
    channel: {
      type: String,
      enum: ["marquee_discovery", "instagram_link", "direct_qr", "resident_ra"],
      default: "marquee_discovery",
    },
    status: { type: String, enum: ["paid", "refunded"], default: "paid" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
