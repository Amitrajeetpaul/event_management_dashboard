import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, CheckIcon, PlusIcon } from "../../components/icons.jsx";
import { api } from "../../api/client.js";
import "./CreateEvent.css";

const GRADIENTS = [
  { from: "#6B4EFF", to: "#2A1C6E" },
  { from: "#FF4D8D", to: "#8A1E4A" },
  { from: "#21C1B6", to: "#0C5D57" },
  { from: "#FFA23A", to: "#93500A" },
  { from: "#8B7CFF", to: "#4B3EA8" },
  { from: "#2C2A34", to: "#08070B" },
];
const STEPS = ["Basics", "Date & venue", "Tickets", "Settings"];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Techno");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Berlin");
  const [date, setDate] = useState("");
  const [doorsTimeLabel, setDoorsTimeLabel] = useState("11 PM");
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [tiers, setTiers] = useState([{ name: "General Admission", price: 18, quantityTotal: 200 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt] = useState(() => new Date());

  function updateTier(i, field, value) {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  }
  function addTier() {
    setTiers((prev) => [...prev, { name: "", price: 0, quantityTotal: 100 }]);
  }
  function removeTier(i) {
    setTiers((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handlePublish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createEvent({
        title,
        genre,
        city,
        venue,
        neighborhood,
        date,
        doorsTimeLabel,
        description,
        heroGradient: gradient,
        publishImmediately,
        tiers: tiers.filter((t) => t.name).map((t) => ({ ...t, price: Number(t.price), quantityTotal: Number(t.quantityTotal) })),
      });
      navigate(`/events/${res.event.slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const priceFrom = tiers.length ? Math.min(...tiers.map((t) => Number(t.price) || 0)) : 0;
  const canPublish = title && genre && city && venue && date && tiers.some((t) => t.name);

  return (
    <div className="ce">
      <div className="ce__topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/organizer" className="ce__exit">
            <ChevronLeftIcon size={16} color="var(--gray-600)" />
            Exit
          </Link>
          <span style={{ color: "var(--gray-200)" }}>|</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>New event</span>
          <span className="ce__draftBadge">Draft</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="ce__savedIndicator">
            <CheckIcon size={14} color="var(--paid)" strokeWidth={2.4} />
            Saved · {savedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
          <button className="mq-btn mq-btn--secondary mq-btn--sm">Preview</button>
          <button className="mq-btn mq-btn--primary mq-btn--sm" disabled={!canPublish || submitting} onClick={handlePublish}>
            {submitting ? "Publishing…" : "Publish event"}
          </button>
        </div>
      </div>

      <div className="ce__body">
        <div className="ce__steps">
          <div className="ce__stepsEyebrow">EVENT SETUP</div>
          {STEPS.map((s) => (
            <div key={s} className="ce__step">
              {s}
            </div>
          ))}
        </div>

        <div className="ce__form">
          {error && <div className="checkout__error" style={{ marginBottom: 16 }}>{error}</div>}

          <Section title="Basics" sub="What's the event called, and what kind of night is it?">
            <label className="mq-field-label">Event name</label>
            <input className="mq-input" style={{ marginBottom: 16 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Neon Nights: Warehouse 09" />
            <label className="mq-field-label">Genre</label>
            <select className="mq-input" style={{ marginBottom: 16 }} value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option>Techno</option>
              <option>House</option>
              <option>Afrobeats</option>
              <option>Hip-hop</option>
            </select>
            <label className="mq-field-label">Description</label>
            <textarea
              className="mq-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should people expect on the night?"
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </Section>

          <Section title="Date & venue" sub="Where and when the doors open.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <label className="mq-field-label">Date &amp; doors</label>
                <input className="mq-input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="mq-field-label">Doors label</label>
                <input className="mq-input" value={doorsTimeLabel} onChange={(e) => setDoorsTimeLabel(e.target.value)} placeholder="11 PM–6 AM" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label className="mq-field-label">Venue</label>
                <input className="mq-input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Warehouse 09" />
              </div>
              <div>
                <label className="mq-field-label">Neighborhood</label>
                <input className="mq-input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Kreuzberg" />
              </div>
              <div>
                <label className="mq-field-label">City</label>
                <input className="mq-input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Tickets" sub="Add the tiers people can buy. You can reorder, pause or hide any tier after publishing.">
            {tiers.map((t, i) => (
              <div key={i} className="ce__tierCard">
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
                  <div>
                    <label className="mq-field-label">NAME</label>
                    <input className="mq-input" value={t.name} onChange={(e) => updateTier(i, "name", e.target.value)} placeholder="General Admission" />
                  </div>
                  <div>
                    <label className="mq-field-label">PRICE</label>
                    <input className="mq-input mono" type="number" min="0" value={t.price} onChange={(e) => updateTier(i, "price", e.target.value)} />
                  </div>
                  <div>
                    <label className="mq-field-label">QUANTITY</label>
                    <input className="mq-input mono" type="number" min="0" value={t.quantityTotal} onChange={(e) => updateTier(i, "quantityTotal", e.target.value)} />
                  </div>
                  <button className="ce__removeTier" onClick={() => removeTier(i)} disabled={tiers.length === 1} type="button">
                    ×
                  </button>
                </div>
              </div>
            ))}
            <button className="ce__addTier" onClick={addTier} type="button">
              <PlusIcon size={16} color="var(--violet-600)" strokeWidth={2.4} />
              Add ticket type
            </button>
          </Section>

          <Section title="Settings" sub="How the event enters the world.">
            <div className="ce__gradientRow">
              {GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  className={`ce__gradientSwatch${gradient === g ? " ce__gradientSwatch--active" : ""}`}
                  style={{ background: `linear-gradient(150deg, ${g.from}, ${g.to})` }}
                  onClick={() => setGradient(g)}
                  aria-label={`Cover gradient ${i + 1}`}
                />
              ))}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, cursor: "pointer" }}>
              <span className={`ce__toggle${publishImmediately ? " ce__toggle--on" : ""}`} onClick={() => setPublishImmediately((v) => !v)}>
                <span className="ce__toggleKnob" />
              </span>
              <span style={{ fontSize: 14 }}>Publish immediately (otherwise saved as draft)</span>
            </label>
          </Section>
        </div>

        <div className="ce__preview">
          <div className="ce__previewLabel">LIVE PREVIEW</div>
          <div className="ce__previewCard">
            <div className="ce__previewHero" style={{ background: `linear-gradient(150deg, ${gradient.from}, ${gradient.to})` }}>
              <span className="ce__previewTag">{doorsTimeLabel || "Doors TBA"}</span>
              <div className="ce__previewTitle">{(title || "Your event name").toUpperCase()}</div>
            </div>
            <div className="ce__previewBody">
              <div style={{ fontWeight: 600, fontSize: 15 }}>{venue || "Venue"}{neighborhood ? ` · ${neighborhood}` : ""}</div>
              <div style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 2 }}>{genre}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                  €{priceFrom} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--gray-500)" }}>from</span>
                </span>
                <span className="ce__previewCta">Get tickets</span>
              </div>
            </div>
          </div>
          <div className="ce__previewNote">This is exactly what attendees see in Discovery and search. Changes here update instantly.</div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <div className="ce__section">
      <h2 className="ce__sectionTitle">{title}</h2>
      <p className="ce__sectionSub">{sub}</p>
      {children}
    </div>
  );
}
