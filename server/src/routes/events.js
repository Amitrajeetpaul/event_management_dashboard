import { Router } from "express";
import Event from "../models/Event.js";
import TicketTier from "../models/TicketTier.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

async function withTiers(event) {
  const tiers = await TicketTier.find({ event: event._id }).sort({ sortIndex: 1 });
  const priceFrom = tiers.length ? Math.min(...tiers.map((t) => t.price)) : 0;
  return { event, tiers, priceFrom };
}

function serializeCard({ event, tiers, priceFrom }) {
  const remaining = tiers.reduce((sum, t) => sum + Math.max(t.quantityTotal - t.quantitySold, 0), 0);
  return {
    id: event._id,
    slug: event.slug,
    title: event.title,
    lineup: event.lineup,
    genre: event.genre,
    vibe: event.vibe,
    city: event.city,
    venue: event.venue,
    neighborhood: event.neighborhood,
    date: event.date,
    doorsTimeLabel: event.doorsTimeLabel,
    heroGradient: event.heroGradient,
    badge: event.badge,
    priceFrom,
    goingCount: event.goingCount,
    lowStock: remaining > 0 && remaining <= 10,
    soldOut: remaining === 0,
  };
}

// GET /api/events — discovery grid with facets
router.get("/", async (req, res, next) => {
  try {
    const { city, genre, vibe, when, q, sort = "trending" } = req.query;
    const filter = { status: "live" };
    if (city) filter.city = city;
    if (genre) filter.genre = genre;
    if (vibe) filter.vibe = vibe;
    if (q) filter.title = { $regex: q, $options: "i" };

    if (when === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    } else if (when === "weekend" || when === "week") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + (when === "weekend" ? 4 : 7));
      filter.date = { $gte: start, $lt: end };
    }

    let events = await Event.find(filter);
    const withPricing = await Promise.all(events.map((e) => withTiers(e)));
    let cards = withPricing.map(serializeCard);

    if (sort === "priceAsc") cards.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === "priceDesc") cards.sort((a, b) => b.priceFrom - a.priceFrom);
    else if (sort === "soonest") cards.sort((a, b) => new Date(a.date) - new Date(b.date));
    else cards.sort((a, b) => b.goingCount - a.goingCount); // trending

    const genreCounts = {};
    const vibeCounts = {};
    for (const e of events) {
      genreCounts[e.genre] = (genreCounts[e.genre] || 0) + 1;
      for (const v of e.vibe) vibeCounts[v] = (vibeCounts[v] || 0) + 1;
    }

    res.json({
      events: cards,
      facets: {
        genres: Object.entries(genreCounts).map(([name, count]) => ({ name, count })),
        vibes: Object.entries(vibeCounts).map(([name, count]) => ({ name, count })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:slug — full detail for Event Details page
router.get("/:slug", async (req, res, next) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    if (!event) throw new HttpError(404, "Event not found");
    const tiers = await TicketTier.find({ event: event._id }).sort({ sortIndex: 1 });
    res.json({
      id: event._id,
      slug: event.slug,
      title: event.title,
      lineup: event.lineup,
      genre: event.genre,
      vibe: event.vibe,
      city: event.city,
      venue: event.venue,
      neighborhood: event.neighborhood,
      date: event.date,
      doorsTimeLabel: event.doorsTimeLabel,
      ageRestriction: event.ageRestriction,
      heroGradient: event.heroGradient,
      badge: event.badge,
      description: event.description,
      amenities: event.amenities,
      goingCount: event.goingCount,
      tiers: tiers.map((t) => ({
        id: t._id,
        name: t.name,
        description: t.description,
        price: t.price,
        currency: t.currency,
        remaining: Math.max(t.quantityTotal - t.quantitySold, 0),
        status: t.status,
        soldOut: t.quantityTotal - t.quantitySold <= 0,
        lowStock: t.quantityTotal - t.quantitySold > 0 && t.quantityTotal - t.quantitySold <= 40,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
