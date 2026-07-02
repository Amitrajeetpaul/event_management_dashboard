import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeftIcon, CalendarIcon, PinIcon, UsersIcon } from "../components/icons.jsx";
import { api } from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";
import "./EventDetails.css";

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { setCart } = useCart();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState({});

  useEffect(() => {
    setEvent(null);
    setError(null);
    api
      .getEvent(slug)
      .then((data) => {
        setEvent(data);
        const initial = {};
        data.tiers.forEach((t) => (initial[t.id] = 0));
        setQty(initial);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) {
    return (
      <div className="ed__wrap">
        <div className="mq-state-block" style={{ margin: 80 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Couldn't load this event</div>
          <div style={{ fontSize: 13, color: "var(--gray-500)" }}>{error}</div>
          <Link to="/discover" className="mq-btn mq-btn--secondary" style={{ marginTop: 12 }}>
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }
  if (!event) {
    return (
      <div className="ed__wrap">
        <div style={{ padding: 56 }}>
          <div className="mq-skeleton" style={{ height: 280, borderRadius: 20, marginBottom: 24 }} />
          <div className="mq-skeleton" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  const totalQty = Object.values(qty).reduce((a, b) => a + b, 0);
  const totalPrice = event.tiers.reduce((sum, t) => sum + (qty[t.id] || 0) * t.price, 0);

  function changeQty(tier, delta) {
    setQty((prev) => {
      const next = Math.max(0, Math.min(tier.remaining, (prev[tier.id] || 0) + delta));
      return { ...prev, [tier.id]: next };
    });
  }

  function handleGetTickets() {
    const lines = event.tiers
      .filter((t) => (qty[t.id] || 0) > 0)
      .map((t) => ({ tierId: t.id, name: t.name, price: t.price, qty: qty[t.id] }));
    if (lines.length === 0) return;
    setCart({
      event: { id: event.id, slug: event.slug, title: event.title, venue: event.venue, neighborhood: event.neighborhood, date: event.date, doorsTimeLabel: event.doorsTimeLabel, heroGradient: event.heroGradient },
      lines,
    });
    navigate("/checkout");
  }

  const eventDate = new Date(event.date);

  return (
    <div className="ed__wrap">
      <div className="ed__crumbBar">
        <div className="ed__crumb">
          <ChevronLeftIcon size={16} color="var(--gray-500)" />
          <Link to="/discover" style={{ color: "var(--gray-500)" }}>
            Discover
          </Link>
          <span style={{ color: "var(--gray-300)" }}>/</span>
          <span style={{ color: "var(--gray-600)" }}>
            {event.genre} · {event.city}
          </span>
          <span style={{ color: "var(--gray-300)" }}>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{event.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="ed__pillBtn">Save</button>
          <button className="ed__pillBtn">Share</button>
        </div>
      </div>

      <div className="ed__content">
        <div className="ed__left">
          <div
            className="ed__hero"
            style={{ background: `linear-gradient(150deg, ${event.heroGradient?.from}, ${event.heroGradient?.to})` }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <span className="ed__heroTag">{event.genre}</span>
              <span className="ed__heroTag">{event.ageRestriction}</span>
              {event.badge && <span className="ed__heroBadge">{event.badge}</span>}
            </div>
            <div>
              <div className="ed__heroTitle">{event.title}</div>
              <div className="ed__heroLineup">{event.lineup}</div>
            </div>
          </div>

          <div className="ed__metaRow">
            <MetaItem icon={CalendarIcon} label="Date" value={`${eventDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} · ${event.doorsTimeLabel}`} />
            <MetaItem icon={PinIcon} label="Venue" value={`${event.venue} · ${event.neighborhood}`} />
            <MetaItem icon={UsersIcon} label="Going" value={`${event.goingCount} people`} />
          </div>

          <div className="ed__about">
            <div className="ed__aboutTitle">About this night</div>
            <p className="ed__aboutText">{event.description}</p>
            <div className="ed__amenities">
              {event.amenities.map((a) => (
                <span key={a} className="ed__amenity">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="ed__right">
          <div className="ed__ticketPanel">
            <div className="ed__ticketHead">
              <span className="ed__ticketHeadTitle">Tickets</span>
              <span className="ed__onSale">On sale now</span>
            </div>
            <div className="ed__ticketSub">Prices incl. booking fee</div>

            {event.tiers.map((t) => {
              const q = qty[t.id] || 0;
              const active = q > 0;
              return (
                <div key={t.id} className={`ed__tier${active ? " ed__tier--active" : ""}${t.soldOut ? " ed__tier--soldout" : ""}`}>
                  <div className="ed__tierTop">
                    <div>
                      <div className="ed__tierName">{t.name}</div>
                      <div className="ed__tierDesc">{t.description}</div>
                    </div>
                    <div className="ed__tierPrice">€{t.price}</div>
                  </div>
                  {t.soldOut ? (
                    <div className="ed__soldOutLabel">Sold out</div>
                  ) : (
                    <div className="ed__tierBottom">
                      <span className={`ed__stockLabel${t.lowStock ? " ed__stockLabel--low" : ""}`}>
                        {t.lowStock ? `Only ${t.remaining} left` : "Available"}
                      </span>
                      <div className="ed__stepper">
                        <button disabled={q === 0} onClick={() => changeQty(t, -1)}>
                          −
                        </button>
                        <span>{q}</span>
                        <button disabled={q >= t.remaining} onClick={() => changeQty(t, 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {totalQty > 0 && (
              <div className="ed__totalRow">
                <span>
                  {totalQty} × {totalQty === 1 ? "ticket" : "tickets"}
                </span>
                <span className="mono">€{totalPrice.toFixed(2)}</span>
              </div>
            )}

            <button className="mq-btn mq-btn--primary mq-btn--full" style={{ padding: 15, fontSize: 17 }} disabled={totalQty === 0} onClick={handleGetTickets}>
              Get tickets →
            </button>
            <div className="ed__secure">🔒 Secure checkout · instant QR delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="ed__metaItem">
      <div className="ed__metaIcon">
        <Icon size={20} color="var(--violet-600)" strokeWidth={1.9} />
      </div>
      <div>
        <div className="ed__metaLabel">{label}</div>
        <div className="ed__metaValue">{value}</div>
      </div>
    </div>
  );
}
