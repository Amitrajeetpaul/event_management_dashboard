import { Router } from "express";
import Ticket from "../models/Ticket.js";
import Order from "../models/Order.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

// GET /api/wallet?email=amara.okafor@gmail.com
router.get("/", async (req, res, next) => {
  try {
    const email = req.query.email || "amara.okafor@gmail.com";
    const tickets = await Ticket.find({ holderEmail: email }).populate("event").populate("tier");
    const now = new Date();

    const grouped = new Map();
    for (const t of tickets) {
      if (!t.event) continue;
      const key = String(t.event._id);
      if (!grouped.has(key)) grouped.set(key, { event: t.event, tickets: [] });
      grouped.get(key).tickets.push(t);
    }

    const upcoming = [];
    const past = [];
    for (const { event, tickets: ts } of grouped.values()) {
      const activeTickets = ts.filter((t) => t.status !== "refunded" && t.status !== "voided");
      if (activeTickets.length === 0) continue;
      const entry = {
        eventId: event._id,
        eventSlug: event.slug,
        title: event.title,
        venue: event.venue,
        neighborhood: event.neighborhood,
        date: event.date,
        doorsTimeLabel: event.doorsTimeLabel,
        heroGradient: event.heroGradient,
        tierSummary: summarizeTiers(activeTickets),
        ticketCount: activeTickets.length,
        firstCode: activeTickets[0].code,
      };
      if (new Date(event.date) >= now) upcoming.push(entry);
      else past.push(entry);
    }
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    const orders = await Order.find({ buyerEmail: email }).populate("event").sort({ createdAt: -1 });
    const paymentHistory = orders.map((o) => ({
      id: o._id,
      title: o.event ? o.event.title : "Event",
      date: o.createdAt,
      method: o.paymentMethod,
      total: o.total,
      status: o.status,
    }));

    res.json({ upcoming, past, paymentHistory });
  } catch (err) {
    next(err);
  }
});

function summarizeTiers(tickets) {
  const counts = new Map();
  for (const t of tickets) {
    const name = t.tier ? t.tier.name : "Ticket";
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, qty]) => `${shortTierName(name)} · ×${qty}`)
    .join(", ");
}
function shortTierName(name) {
  if (/general admission/i.test(name)) return "GA";
  if (/fast track/i.test(name)) return "GA+FT";
  if (/vip/i.test(name)) return "VIP";
  return name;
}

// GET /api/wallet/ticket/:code — QR detail screen
router.get("/ticket/:code", async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ code: req.params.code }).populate("event").populate("tier");
    if (!ticket) throw new HttpError(404, "Ticket not found");
    const siblingCount = await Ticket.countDocuments({ order: ticket.order });
    const siblingIndex = await Ticket.countDocuments({ order: ticket.order, _id: { $lte: ticket._id } });
    res.json({
      code: ticket.code,
      status: ticket.status,
      holderName: ticket.holderName,
      tierName: ticket.tier?.name,
      indexLabel: `${ticket.tier?.name} · Ticket ${siblingIndex} of ${siblingCount}`,
      event: {
        title: ticket.event.title,
        venue: ticket.event.venue,
        date: ticket.event.date,
        heroGradient: ticket.event.heroGradient,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
