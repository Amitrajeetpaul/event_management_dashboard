import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    tier: { type: mongoose.Schema.Types.ObjectId, ref: "TicketTier", required: true },
    code: { type: String, required: true, unique: true },
    holderName: { type: String, required: true },
    holderEmail: { type: String, required: true },
    status: {
      type: String,
      enum: ["valid", "checked_in", "voided", "refunded"],
      default: "valid",
    },
    checkedInAt: { type: Date, default: null },
    gate: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
