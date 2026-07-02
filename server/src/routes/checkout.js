import { Router } from "express";
import { customAlphabet } from "nanoid";
import Event from "../models/Event.js";
import TicketTier from "../models/TicketTier.js";
import Order from "../models/Order.js";
import Ticket from "../models/Ticket.js";
import { HttpError } from "../middleware/errorHandler.js";
import { money } from "../lib/helpers.js";

const router = Router();
const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 4);

// POST /api/checkout
// body: { eventId, buyerName, buyerEmail, paymentMethod, lines: [{ tierId, quantity }] }
router.post("/", async (req, res, next) => {
  try {
    const { eventId, buyerName, buyerEmail, paymentMethod = "card", lines } = req.body;
    if (!eventId || !buyerName || !buyerEmail || !Array.isArray(lines) || lines.length === 0) {
      throw new HttpError(400, "eventId, buyerName, buyerEmail and lines are required");
    }

    const event = await Event.findById(eventId);
    if (!event) throw new HttpError(404, "Event not found");

    const orderLines = [];
    const tierDocs = [];
    for (const line of lines) {
      if (!line.tierId || !line.quantity || line.quantity < 1) continue;
      const tier = await TicketTier.findOne({ _id: line.tierId, event: eventId });
      if (!tier) throw new HttpError(404, "Ticket tier not found");
      const remaining = tier.quantityTotal - tier.quantitySold;
      if (line.quantity > remaining) {
        throw new HttpError(409, `Only ${remaining} left for ${tier.name}`);
      }
      orderLines.push({ tier: tier._id, name: tier.name, price: tier.price, quantity: line.quantity });
      tierDocs.push({ tier, quantity: line.quantity });
    }
    if (orderLines.length === 0) throw new HttpError(400, "No valid ticket lines");

    const subtotal = money(orderLines.reduce((sum, l) => sum + l.price * l.quantity, 0));
    const fee = money(subtotal * 0.08);
    const total = money(subtotal + fee);

    const order = await Order.create({
      event: eventId,
      buyerName,
      buyerEmail,
      lines: orderLines,
      subtotal,
      fee,
      total,
      paymentMethod,
      channel: "marquee_discovery",
      status: "paid",
    });

    const tickets = [];
    for (const { tier, quantity } of tierDocs) {
      for (let i = 0; i < quantity; i++) {
        tickets.push({
          order: order._id,
          event: eventId,
          tier: tier._id,
          code: `MQ-${code()}`,
          holderName: buyerName,
          holderEmail: buyerEmail,
          status: "valid",
        });
      }
      await TicketTier.updateOne({ _id: tier._id }, { $inc: { quantitySold: quantity } });
    }
    const createdTickets = await Ticket.insertMany(tickets);
    await Event.updateOne({ _id: eventId }, { $inc: { goingCount: createdTickets.length } });

    res.status(201).json({
      order: {
        id: order._id,
        subtotal,
        fee,
        total,
        buyerName,
        buyerEmail,
      },
      tickets: createdTickets.map((t) => ({ id: t._id, code: t.code })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
