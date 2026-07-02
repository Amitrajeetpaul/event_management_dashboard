import { Router } from "express";
import Ticket from "../models/Ticket.js";
import DoorScan from "../models/DoorScan.js";
import Event from "../models/Event.js";
import { getWorkspace, getActiveEvent } from "../lib/helpers.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

// POST /api/door/scan  body: { code, gate, staffName }
router.post("/scan", async (req, res, next) => {
  try {
    const { code, gate = "Gate A · main", staffName = "Malik" } = req.body;
    if (!code) throw new HttpError(400, "code is required");

    const workspace = await getWorkspace();
    const activeEvent = await getActiveEvent(workspace._id);
    if (!activeEvent) throw new HttpError(404, "No active event tonight");

    const ticket = await Ticket.findOne({ code: code.trim().toUpperCase() }).populate("tier");

    let result;
    let payload;

    if (!ticket) {
      result = "invalid";
      payload = { message: "Ticket not found" };
    } else if (String(ticket.event) !== String(activeEvent._id)) {
      result = "wrong_event";
      const otherEvent = await Event.findById(ticket.event);
      payload = { message: `This ticket is for ${otherEvent ? otherEvent.title : "another event"}`, otherEventTitle: otherEvent?.title };
    } else if (ticket.status === "refunded" || ticket.status === "voided") {
      result = "invalid";
      payload = { message: `Ticket ${ticket.status}` };
    } else if (ticket.status === "checked_in") {
      result = "already_scanned";
      payload = {
        message: "Already scanned",
        checkedInAt: ticket.checkedInAt,
        gate: ticket.gate,
        holderName: ticket.holderName,
      };
    } else {
      ticket.status = "checked_in";
      ticket.checkedInAt = new Date();
      ticket.gate = gate;
      await ticket.save();
      result = "admit";
      payload = {
        holderName: ticket.holderName,
        tierName: ticket.tier?.name,
        code: ticket.code,
      };
    }

    await DoorScan.create({
      event: activeEvent._id,
      ticket: ticket?._id || null,
      code: code.trim().toUpperCase(),
      staffName,
      gate,
      result,
    });

    const checkedIn = await Ticket.countDocuments({ event: activeEvent._id, status: "checked_in" });
    const capacity = await Ticket.countDocuments({ event: activeEvent._id, status: { $in: ["valid", "checked_in"] } });

    res.json({ result, ...payload, stats: { checkedIn, capacity, remaining: Math.max(capacity - checkedIn, 0) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/door/stats — live throughput for the scanner + attendance overview screens
router.get("/stats", async (req, res, next) => {
  try {
    const workspace = await getWorkspace();
    const activeEvent = await getActiveEvent(workspace._id);
    if (!activeEvent) throw new HttpError(404, "No active event tonight");

    const checkedIn = await Ticket.countDocuments({ event: activeEvent._id, status: "checked_in" });
    const capacity = await Ticket.countDocuments({ event: activeEvent._id, status: { $in: ["valid", "checked_in"] } });

    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    const recentScans = await DoorScan.countDocuments({ event: activeEvent._id, result: "admit", createdAt: { $gte: fiveMinAgo } });

    const rejected = await DoorScan.countDocuments({ event: activeEvent._id, result: { $ne: "admit" } });
    const myScans = await DoorScan.countDocuments({ event: activeEvent._id, result: "admit" });

    // Peak minute bucket over the whole night so far.
    const scans = await DoorScan.find({ event: activeEvent._id, result: "admit" }, "createdAt");
    const buckets = new Map();
    for (const s of scans) {
      const d = new Date(s.createdAt);
      d.setSeconds(0, 0);
      const key = d.toISOString();
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    let peak = null;
    let peakCount = 0;
    for (const [key, count] of buckets.entries()) {
      if (count > peakCount) {
        peakCount = count;
        peak = key;
      }
    }

    res.json({
      event: { id: activeEvent._id, title: activeEvent.title },
      checkedIn,
      capacity,
      remaining: Math.max(capacity - checkedIn, 0),
      ratePerMinute: Math.round((recentScans / 5) * 10) / 10,
      rejected,
      myScans,
      peakTime: peak ? new Date(peak).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
