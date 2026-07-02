import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    lineup: { type: String, default: "" },
    genre: { type: String, required: true },
    vibe: [{ type: String }],
    city: { type: String, required: true },
    venue: { type: String, required: true },
    neighborhood: { type: String, default: "" },
    date: { type: Date, required: true },
    doorsTimeLabel: { type: String, default: "" },
    dayTimeLabel: { type: String, default: "" },
    ageRestriction: { type: String, default: "18+" },
    heroGradient: { from: String, to: String },
    badge: { type: String, default: "" },
    description: { type: String, default: "" },
    amenities: [{ type: String }],
    goingCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    checkoutStarts: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "live", "cancelled"], default: "live" },
  },
  { timestamps: true }
);

eventSchema.index({ city: 1, genre: 1, date: 1 });

export default mongoose.model("Event", eventSchema);
