import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// Ensure every model is registered before routes populate() across them.
import "./models/Workspace.js";
import Event from "./models/Event.js";
import { seedDatabase } from "./seed/seed.js";
import "./models/TicketTier.js";
import "./models/Order.js";
import "./models/Ticket.js";
import "./models/DoorScan.js";

import eventsRouter from "./routes/events.js";
import checkoutRouter from "./routes/checkout.js";
import walletRouter from "./routes/wallet.js";
import organizerRouter from "./routes/organizer.js";
import doorRouter from "./routes/door.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/events", eventsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/organizer", organizerRouter);
app.use("/api/door", doorRouter);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 4000;

connectDB()
  .then(async () => {
    try {
      const eventCount = await Event.countDocuments();
      if (eventCount === 0) {
        console.log("[server] Database is empty. Auto-seeding initial data...");
        await seedDatabase(true);
      }
    } catch (seedErr) {
      console.error("[server] Auto-seeding failed:", seedErr);
    }
    app.listen(port, () => console.log(`[server] listening on :${port}`));
  })
  .catch((err) => {
    console.error("[server] failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
