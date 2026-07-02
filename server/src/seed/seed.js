import "dotenv/config";
import { customAlphabet } from "nanoid";
import { connectDB } from "../db.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import Event from "../models/Event.js";
import TicketTier from "../models/TicketTier.js";
import Order from "../models/Order.js";
import Ticket from "../models/Ticket.js";
import DoorScan from "../models/DoorScan.js";
import {
  workspaceSeed,
  demoAttendee,
  eventDefs,
  neonNightsAttendees,
  demoAttendeeOrders,
} from "./data.js";

const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const nextCode = () => `MQ-${code()}`;

const FIRST_NAMES = [
  "Mila", "Jonas", "Elif", "Kwame", "Nadia", "Ravi", "Ines", "Tomasz", "Yara", "Felix",
  "Sofia", "Adrian", "Mei", "Bilal", "Greta", "Anton", "Leila", "Marco", "Zuri", "Oskar",
  "Camila", "Youssef", "Freya", "Dario", "Amina", "Lukas", "Noor", "Viktor", "Selin", "Pedro",
];
const LAST_NAMES = [
  "Krause", "Novak", "Adeyemi", "Berger", "Rossi", "Dubois", "Kowalski", "Hassan", "Lindqvist", "Moreau",
  "Schäfer", "Nakamura", "Osei", "Petrov", "Fischer", "Ibrahim", "Costa", "Weiss", "Andersson", "Kilic",
];
const EMAIL_DOMAINS = ["gmail.com", "proton.me", "web.de", "outlook.com", "gmx.de"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
function emailFor(name) {
  const handle = name.toLowerCase().replace(/[^a-z]+/g, ".");
  return `${handle}@${pick(EMAIL_DOMAINS)}`;
}
// Biased toward recent days so cumulative revenue trends up toward tonight, like the deck's chart.
function biasedDaysAgo(maxDays) {
  return Math.floor(Math.pow(Math.random(), 1.6) * maxDays);
}
const CHANNELS = [
  { channel: "marquee_discovery", weight: 0.46 },
  { channel: "instagram_link", weight: 0.3 },
  { channel: "direct_qr", weight: 0.18 },
  { channel: "resident_ra", weight: 0.06 },
];
function randomChannel() {
  const r = Math.random();
  let acc = 0;
  for (const c of CHANNELS) {
    acc += c.weight;
    if (r <= acc) return c.channel;
  }
  return "marquee_discovery";
}

function todayAt(hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}
function eventDateFor(def) {
  const d = todayAt(def.startHour);
  d.setDate(d.getDate() + def.dayOffset);
  return d;
}

export async function seedDatabase(skipConnection = false) {
  if (!skipConnection) {
    await connectDB();
  }

  console.log("[seed] clearing collections…");
  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    Event.deleteMany({}),
    TicketTier.deleteMany({}),
    Order.deleteMany({}),
    Ticket.deleteMany({}),
    DoorScan.deleteMany({}),
  ]);

  const user = await User.create({
    name: "Rina Kessler",
    email: "rina.kessler@warehouse09.com",
    password: "password123",
    role: "organizer",
  });
  console.log(`[seed] user: ${user.email}`);

  const workspace = await Workspace.create({
    ...workspaceSeed,
    owner: user._id,
  });
  console.log(`[seed] workspace: ${workspace.name}`);

  const eventsByKey = {};
  const tiersByEventKey = {};

  for (const def of eventDefs) {
    const event = await Event.create({
      workspace: workspace._id,
      title: def.title,
      slug: def.slug,
      lineup: def.lineup,
      genre: def.genre,
      vibe: def.vibe,
      city: def.city,
      venue: def.venue,
      neighborhood: def.neighborhood,
      date: eventDateFor(def),
      doorsTimeLabel: def.doorsTimeLabel,
      ageRestriction: def.ageRestriction,
      heroGradient: def.heroGradient,
      badge: def.badge,
      description: def.description,
      amenities: def.amenities,
      viewCount: def.viewCount,
      checkoutStarts: def.checkoutStarts,
      status: "live",
    });
    eventsByKey[def.key] = event;

    const tiers = [];
    for (let i = 0; i < def.tiers.length; i++) {
      const t = def.tiers[i];
      const tier = await TicketTier.create({
        event: event._id,
        name: t.name,
        description: t.description,
        price: t.price,
        quantityTotal: t.quantityTotal,
        quantitySold: 0, // incremented as we create tickets below, kept authoritative
        sortIndex: i,
      });
      tiers.push({ doc: tier, def: t });
    }
    tiersByEventKey[def.key] = tiers;
  }
  console.log(`[seed] ${eventDefs.length} events + tiers created`);

  // ---- Neon Nights: fully reconciled attendee list + door monitor ----
  const neonEvent = eventsByKey["neon-nights"];
  const neonTiers = tiersByEventKey["neon-nights"];
  const gaTier = neonTiers.find((t) => t.doc.name === "General Admission");
  const fastTrackTier = neonTiers.find((t) => t.doc.name === "GA + Fast Track");
  const vipTier = neonTiers.find((t) => t.doc.name === "VIP Balcony");

  const doorOpen = todayAt(22, 45);
  const doorNow = todayAt(23, 31);
  function randomCheckinTime() {
    const span = doorNow.getTime() - doorOpen.getTime();
    return new Date(doorOpen.getTime() + Math.random() * span);
  }
  function namedCheckinTime(hour, minute) {
    return todayAt(hour, minute);
  }

  const staffName = "Malik";

  async function createOrderWithTickets({ event, tier, buyerName, buyerEmail, quantity, channel, daysAgo, status = "paid" }) {
    const unitPrice = tier.doc.price;
    const subtotal = unitPrice * quantity;
    const fee = Math.round(subtotal * 0.08 * 100) / 100;
    const order = await Order.create({
      event: event._id,
      buyerName,
      buyerEmail,
      lines: [{ tier: tier.doc._id, name: tier.doc.name, price: unitPrice, quantity }],
      subtotal,
      fee,
      total: Math.round((subtotal + fee) * 100) / 100,
      channel,
      status,
      createdAt: new Date(Date.now() - daysAgo * 86400000),
    });
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      tickets.push({
        _id: new mongoose.Types.ObjectId(),
        order: order._id,
        event: event._id,
        tier: tier.doc._id,
        code: nextCode(),
        holderName: buyerName,
        holderEmail: buyerEmail,
        status: status === "refunded" ? "refunded" : "valid",
      });
    }
    return { order, tickets };
  }

  const neonTicketDocs = [];

  // Named attendees, exactly matching the Attendees & Door slide.
  for (const a of neonNightsAttendees) {
    const tier = a.tierName === "VIP Balcony" ? vipTier : a.tierName === "GA + Fast Track" ? fastTrackTier : gaTier;
    const { order, tickets } = await createOrderWithTickets({
      event: neonEvent,
      tier,
      buyerName: a.name,
      buyerEmail: a.email,
      quantity: a.quantity,
      channel: "marquee_discovery",
      daysAgo: a.refunded ? 20 : randomInt(1, 6),
      status: a.refunded ? "refunded" : "paid",
    });
    tickets.forEach((t, i) => {
      t.code = a.codes[i] || t.code;
      if (a.checkedIn) {
        t.status = "checked_in";
        t.checkedInAt = namedCheckinTime(a.checkedInAt.hour, a.checkedInAt.minute);
        t.gate = a.gate;
      }
    });
    neonTicketDocs.push(...tickets);
  }

  // Reconciled synthetic fill so tier sold counts + gate totals match the deck exactly:
  // GA: 266 sold (40 left of 306), 218 checked in via Gate A · main
  // GA + Fast Track: 90 sold (30 left of 120), 70 checked in via Gate B · guest
  // VIP Balcony: 24 sold (sold out), 24 checked in via VIP entrance
  const plan = [
    { tier: gaTier, gate: "Gate A · main", targetSold: 266, targetCheckedIn: 218, alreadyNamed: { sold: 6, checkedIn: 5 } },
    { tier: fastTrackTier, gate: "Gate B · guest", targetSold: 90, targetCheckedIn: 70, alreadyNamed: { sold: 0, checkedIn: 0 } },
    { tier: vipTier, gate: "VIP entrance", targetSold: 24, targetCheckedIn: 24, alreadyNamed: { sold: 1, checkedIn: 1 } },
  ];

  for (const p of plan) {
    const remainingSold = p.targetSold - p.alreadyNamed.sold;
    let remainingCheckedIn = p.targetCheckedIn - p.alreadyNamed.checkedIn;
    let left = remainingSold;
    while (left > 0) {
      const qty = Math.min(left, randomInt(1, 3));
      const name = randomName();
      const email = emailFor(name);
      const willCheckIn = remainingCheckedIn > 0;
      const { tickets } = await createOrderWithTickets({
        event: neonEvent,
        tier: p.tier,
        buyerName: name,
        buyerEmail: email,
        quantity: qty,
        channel: randomChannel(),
        daysAgo: biasedDaysAgo(14),
      });
      if (willCheckIn) {
        const grant = Math.min(qty, remainingCheckedIn);
        for (let i = 0; i < grant; i++) {
          tickets[i].status = "checked_in";
          tickets[i].checkedInAt = randomCheckinTime();
          tickets[i].gate = p.gate;
        }
        remainingCheckedIn -= grant;
      }
      neonTicketDocs.push(...tickets);
      left -= qty;
    }
  }

  await Ticket.insertMany(neonTicketDocs);
  for (const p of plan) {
    await TicketTier.updateOne({ _id: p.tier.doc._id }, { $set: { quantitySold: p.targetSold } });
  }

  // Door scan log, derived from the checked-in tickets (for throughput / rate display).
  const checkedIn = neonTicketDocs.filter((t) => t.status === "checked_in").sort((a, b) => a.checkedInAt - b.checkedInAt);
  await DoorScan.insertMany(
    checkedIn.map((t) => ({
      event: neonEvent._id,
      ticket: t._id ?? null,
      code: t.code,
      staffName,
      gate: t.gate,
      result: "admit",
      createdAt: t.checkedInAt,
    }))
  );
  console.log(`[seed] Neon Nights: ${neonTicketDocs.length} tickets, ${checkedIn.length} checked in`);

  // ---- Other events: bulk synthetic sales, no door activity (not tonight) ----
  for (const def of eventDefs) {
    if (def.key === "neon-nights") continue;
    const event = eventsByKey[def.key];
    const tiers = tiersByEventKey[def.key];
    for (const t of tiers) {
      let left = t.def.quantitySold;
      const bulkTickets = [];
      while (left > 0) {
        const qty = Math.min(left, randomInt(1, 4));
        const name = randomName();
        const { tickets } = await createOrderWithTickets({
          event,
          tier: t,
          buyerName: name,
          buyerEmail: emailFor(name),
          quantity: qty,
          channel: randomChannel(),
          daysAgo: biasedDaysAgo(21),
        });
        bulkTickets.push(...tickets);
        left -= qty;
      }
      if (bulkTickets.length) await Ticket.insertMany(bulkTickets);
      await TicketTier.updateOne({ _id: t.doc._id }, { $set: { quantitySold: t.def.quantitySold } });
    }
  }
  console.log("[seed] bulk sales created for remaining events");

  // Recompute goingCount per event from valid+checked_in ticket counts.
  for (const key of Object.keys(eventsByKey)) {
    const event = eventsByKey[key];
    const going = await Ticket.countDocuments({ event: event._id, status: { $in: ["valid", "checked_in"] } });
    await Event.updateOne({ _id: event._id }, { $set: { goingCount: going } });
  }

  // ---- Demo attendee (Amara Okafor) payment history, matching the wallet slide ----
  for (const o of demoAttendeeOrders) {
    if (o.eventKey === "neon-nights") continue; // already created above with exact codes/status
    const event = eventsByKey[o.eventKey];
    const tiers = tiersByEventKey[o.eventKey];
    const tier = tiers.find((t) => t.doc.name === o.tierName) || tiers[0];
    const subtotal = o.total; // deck totals already include fee; keep as authored
    const order = await Order.create({
      event: event._id,
      buyerName: demoAttendee.name,
      buyerEmail: demoAttendee.email,
      lines: [{ tier: tier.doc._id, name: tier.doc.name, price: tier.doc.price, quantity: o.quantity }],
      subtotal,
      fee: 0,
      total: o.total,
      paymentMethod: o.method,
      channel: "marquee_discovery",
      status: o.status,
      createdAt: new Date(Date.now() - o.daysAgo * 86400000),
    });
    await Ticket.insertMany(
      Array.from({ length: o.quantity }).map(() => ({
        order: order._id,
        event: event._id,
        tier: tier.doc._id,
        code: nextCode(),
        holderName: demoAttendee.name,
        holderEmail: demoAttendee.email,
        status: o.status === "refunded" ? "refunded" : "valid",
      }))
    );
  }
  // Attach payment method to Amara's Neon Nights order for payment-history display.
  await Order.updateOne(
    { event: neonEvent._id, buyerEmail: demoAttendee.email },
    { $set: { paymentMethod: "Visa ···4471" } }
  );

  console.log("[seed] done.");
  if (!skipConnection) {
    await mongoose.disconnect();
  }
}

import { fileURLToPath } from "url";
const isMain = process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith("seed.js"));
if (isMain) {
  seedDatabase().catch(async (err) => {
    console.error("[seed] failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  });
}
