import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    avatarInitial: { type: String, required: true },
    avatarColor: { type: String, default: "#FF4D8D" },
    ownerName: { type: String, required: true },
    ownerRole: { type: String, default: "Owner" },
    ownerInitials: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Workspace", workspaceSchema);
