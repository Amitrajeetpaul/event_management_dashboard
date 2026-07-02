import mongoose from "mongoose";

const ticketTierSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    quantityTotal: { type: Number, required: true },
    quantitySold: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "paused", "sold_out"], default: "active" },
    sortIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ticketTierSchema.virtual("remaining").get(function remaining() {
  return Math.max(this.quantityTotal - this.quantitySold, 0);
});

ticketTierSchema.set("toJSON", { virtuals: true });

export default mongoose.model("TicketTier", ticketTierSchema);
