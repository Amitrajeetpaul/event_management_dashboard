import { Router } from "express";
import Event from "../models/Event.js";
import TicketTier from "../models/TicketTier.js";
import Order from "../models/Order.js";
import Ticket from "../models/Ticket.js";
import DoorScan from "../models/DoorScan.js";
import { getActiveEvent, money } from "../lib/helpers.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

router.get("/workspace", async (req, res, next) => {
  try {
    res.json(req.workspace);
  } catch (err) {
    next(err);
  }
});

// GET /api/organizer/dashboard — Home KPIs, sales chart, live activity
router.get("/dashboard", async (req, res, next) => {
  try {
    const workspace = req.workspace;
    const eventIds = (await Event.find({ workspace: workspace._id }, "_id")).map((e) => e._id);

    const since = new Date(Date.now() - 30 * 86400000);
    const orders = await Order.find({ event: { $in: eventIds }, createdAt: { $gte: since } });
    const ticketsSold = orders.reduce((sum, o) => (o.status === "paid" ? sum + o.lines.reduce((s, l) => s + l.quantity, 0) : sum), 0);
    const grossRevenue = money(orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.total, 0));
    const netRevenue = money(orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.subtotal, 0));
    const pageViews = (await Event.find({ workspace: workspace._id })).reduce((sum, e) => sum + e.viewCount, 0);

    const activeEvent = await getActiveEvent(workspace._id);
    let checkedInTonight = 0;
    let capacityTonight = 0;
    if (activeEvent) {
      const tiers = await TicketTier.find({ event: activeEvent._id });
      capacityTonight = tiers.reduce((sum, t) => sum + t.quantitySold, 0);
      checkedInTonight = await Ticket.countDocuments({ event: activeEvent._id, status: "checked_in" });
    }

    // Sales over time, last 7 days, split GA-ish vs VIP-ish for the two-series bar chart.
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const dayOrders = await Order.find({
        event: { $in: eventIds },
        status: "paid",
        createdAt: { $gte: start, $lt: end },
      });
      let ga = 0;
      let vip = 0;
      for (const o of dayOrders) {
        for (const l of o.lines) {
          if (/vip/i.test(l.name)) vip += l.price * l.quantity;
          else ga += l.price * l.quantity;
        }
      }
      days.push({ label: start.toLocaleDateString("en-US", { weekday: "short" }), ga: money(ga), vip: money(vip) });
    }

    const recentOrders = await Order.find({ event: { $in: eventIds } })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("event", "title");
    const recentScans = await DoorScan.find({ event: { $in: eventIds }, result: "admit" })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("ticket", "holderName");

    const activity = [
      ...recentOrders.map((o) => ({
        type: "sale",
        text: `${o.lines.map((l) => `${l.quantity} × ${shortTier(l.name)}`).join(", ")} sold to ${shortName(o.buyerName)}`,
        detail: `+€${o.total.toFixed(2)}`,
        at: o.createdAt,
      })),
      ...recentScans.map((s) => ({
        type: "checkin",
        text: `${shortName(s.ticket?.holderName)} checked in at door`,
        detail: `${new Date(s.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${s.gate || ""}`,
        at: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6);

    res.json({
      workspace,
      ownerGreetingName: req.user.name.split(" ")[0],
      kpis: {
        ticketsSold,
        grossRevenue,
        netRevenue,
        checkedInTonight,
        capacityTonight,
        pageViews,
        checkoutConversion: activeEvent ? money((activeEvent.checkoutStarts / Math.max(activeEvent.viewCount, 1)) * 100) : 0,
      },
      salesOverTime: days,
      activity,
      activeEvent: activeEvent ? { id: activeEvent._id, title: activeEvent.title, slug: activeEvent.slug } : null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/organizer/events — Create Event
router.post("/events", async (req, res, next) => {
  try {
    const workspace = req.workspace;
    const {
      title,
      genre,
      city,
      venue,
      neighborhood,
      date,
      doorsTimeLabel,
      description,
      heroGradient,
      publishImmediately,
      tiers = [],
    } = req.body;
    if (!title || !genre || !city || !venue || !date) {
      throw new HttpError(400, "title, genre, city, venue and date are required");
    }
    const slug = slugify(title);
    const event = await Event.create({
      workspace: workspace._id,
      title,
      slug,
      genre,
      city,
      venue,
      neighborhood,
      date,
      doorsTimeLabel,
      description,
      heroGradient: heroGradient || { from: "#6B4EFF", to: "#2A1C6E" },
      status: publishImmediately ? "live" : "draft",
    });
    const tierDocs = await TicketTier.insertMany(
      tiers.map((t, i) => ({
        event: event._id,
        name: t.name,
        price: t.price,
        quantityTotal: t.quantityTotal,
        sortIndex: i,
      }))
    );
    res.status(201).json({ event, tiers: tierDocs });
  } catch (err) {
    if (err.code === 11000) return next(new HttpError(409, "An event with this name already exists"));
    next(err);
  }
});

// GET /api/organizer/analytics?eventId=
router.get("/analytics", async (req, res, next) => {
  try {
    const workspace = req.workspace;
    const event = req.query.eventId
      ? await Event.findById(req.query.eventId)
      : await getActiveEvent(workspace._id);
    if (!event) throw new HttpError(404, "No event found");

    const orders = await Order.find({ event: event._id });
    const paidOrders = orders.filter((o) => o.status === "paid");
    const grossRevenue = money(paidOrders.reduce((sum, o) => sum + o.total, 0));
    const netRevenue = money(paidOrders.reduce((sum, o) => sum + o.subtotal, 0));
    const feesTotal = money(grossRevenue - netRevenue);
    const ticketsSold = paidOrders.reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.quantity, 0), 0);
    const avgOrderValue = paidOrders.length ? money(grossRevenue / paidOrders.length) : 0;
    const refundedCount = orders.filter((o) => o.status === "refunded").length;
    const refundRate = orders.length ? money((refundedCount / orders.length) * 100) : 0;

    const byChannel = {};
    for (const o of paidOrders) byChannel[o.channel] = (byChannel[o.channel] || 0) + o.total;
    const channelLabels = {
      marquee_discovery: "Marquee discovery",
      instagram_link: "Instagram link",
      direct_qr: "Direct / QR flyer",
      resident_ra: "Resident RA",
    };
    const revenueByChannel = Object.entries(byChannel)
      .map(([channel, total]) => ({ channel: channelLabels[channel] || channel, total: money(total) }))
      .sort((a, b) => b.total - a.total);

    // Cumulative revenue, oldest sale to today.
    const sorted = [...paidOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let running = 0;
    const cumulative = sorted.map((o) => {
      running += o.total;
      return { at: o.createdAt, total: money(running) };
    });

    res.json({
      event: { id: event._id, title: event.title },
      kpis: { grossRevenue, netRevenue, feesTotal, avgOrderValue, refundRate },
      revenueByChannel,
      funnel: {
        views: event.viewCount,
        checkoutStarts: event.checkoutStarts,
        purchased: ticketsSold,
        checkoutStartRate: event.viewCount ? money((event.checkoutStarts / event.viewCount) * 100) : 0,
        purchaseRate: event.checkoutStarts ? money((ticketsSold / event.checkoutStarts) * 100) : 0,
      },
      cumulativeRevenue: cumulative,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/organizer/attendees?eventId=&status=&q=
router.get("/attendees", async (req, res, next) => {
  try {
    const workspace = req.workspace;
    const event = req.query.eventId
      ? await Event.findById(req.query.eventId)
      : await getActiveEvent(workspace._id);
    if (!event) throw new HttpError(404, "No event found");

    const filter = { event: event._id };
    const tickets = await Ticket.find(filter).populate("tier").sort({ createdAt: -1 });

    let rows = tickets.map((t) => ({
      id: t._id,
      name: t.holderName,
      email: t.holderEmail,
      tier: shortTier(t.tier?.name || ""),
      code: t.code,
      checkedInAt: t.checkedInAt,
      status: t.status,
    }));

    if (req.query.status === "in") rows = rows.filter((r) => r.status === "checked_in");
    else if (req.query.status === "out") rows = rows.filter((r) => r.status === "valid");
    else if (req.query.status === "vip") rows = rows.filter((r) => r.tier === "VIP");

    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }

    const counts = {
      all: tickets.length,
      in: tickets.filter((t) => t.status === "checked_in").length,
      out: tickets.filter((t) => t.status === "valid").length,
      vip: tickets.filter((t) => /vip/i.test(t.tier?.name || "")).length,
    };

    const gateBuckets = {};
    for (const t of tickets) {
      if (t.status === "checked_in" && t.gate) gateBuckets[t.gate] = (gateBuckets[t.gate] || 0) + 1;
    }
    const byGate = Object.entries(gateBuckets).map(([gate, count]) => ({ gate, count }));

    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    const recentScans = await DoorScan.countDocuments({ event: event._id, result: "admit", createdAt: { $gte: fiveMinAgo } });

    res.json({
      event: { id: event._id, title: event.title },
      rows,
      counts,
      door: {
        checkedIn: counts.in,
        capacity: tickets.length,
        byGate,
        ratePerMinute: money(recentScans / 5),
      },
    });
  } catch (err) {
    next(err);
  }
});

function shortTier(name) {
  if (/general admission/i.test(name)) return "GA";
  if (/fast track/i.test(name)) return "GA+FT";
  if (/vip/i.test(name)) return "VIP";
  return name;
}
function shortName(name) {
  const parts = (name || "").trim().split(" ");
  if (parts.length < 2) return parts[0] || "Someone";
  return `${parts[0]} ${parts[1][0]}.`;
}
function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default router;
