import mongoose from "mongoose";

const doorScanSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", default: null },
    code: { type: String, required: true },
    staffName: { type: String, required: true },
    gate: { type: String, required: true },
    result: {
      type: String,
      enum: ["admit", "already_scanned", "wrong_event", "invalid"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DoorScan", doorScanSchema);
