import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import { HttpError } from "./errorHandler.js";

const JWT_SECRET = process.env.JWT_SECRET || "marquee_secret_key";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Authorization token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new HttpError(401, "Invalid or expired authorization token");
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw new HttpError(401, "User not found");
    }

    // Find the workspace owned by this user
    const workspace = await Workspace.findOne({ owner: user._id });
    
    req.user = user;
    req.workspace = workspace;
    next();
  } catch (err) {
    next(err);
  }
}
