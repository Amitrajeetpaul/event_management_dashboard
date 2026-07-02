import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { SearchIcon, ChevronDownIcon, CheckIcon, HeartIcon } from "../components/icons.jsx";
import { api } from "../api/client.js";
import "./Discovery.css";

export default function Discovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [facets, setFacets] = useState({ genres: [], vibes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const genre = searchParams.get("genre") || "";
  const vibe = searchParams.get("vibe") || "";
  const when = searchParams.get("when") || "";
  const sort = searchParams.get("sort") || "trending";
  const q = searchParams.get("q") || "";

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .listEvents({ genre, vibe, when, sort, q })
      .then((data) => {
        setEvents(data.events);
        setFacets(data.facets);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [genre, vibe, when, sort, q]);

  const title = useMemo(() => {
    if (genre) return `${genre} in Berlin`;
    return "Events in Berlin";
  }, [genre]);

  return (
    <div className="disco">
      <header className="disco__header">
        <div style={{ display: "flex", alignItems: "center", gap: 38 }}>
          <Link to="/">
            <Logo size={30} dark={false} />
          </Link>
          <div className="disco__searchbar">
            <SearchIcon size={17} color="var(--gray-500)" />
            <input
              placeholder="Search Berlin · techno · this weekend"
              defaultValue={q}
              onKeyDown={(e) => e.key === "Enter" && updateParam("q", e.currentTarget.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span className="disco__navlink">Saved</span>
          <Link to="/wallet" className="disco__navlink">
            Tickets
          </Link>
          <div className="disco__avatar">JD</div>
        </div>
      </header>

      <div className="disco__body">
        <aside className="disco__filters">
          <div className="disco__filtersTitle">FILTERS</div>

          <div className="disco__filterLabel">Date</div>
          <div className="disco__chipRow">
            {["weekend", "today", "week"].map((val) => (
              <button
                key={val}
                className={`disco__filterChip${when === val ? " disco__filterChip--active" : ""}`}
                onClick={() => updateParam("when", when === val ? "" : val)}
              >
                {val === "weekend" ? "Weekend" : val === "today" ? "Today" : "This week"}
              </button>
            ))}
          </div>

          <div className="disco__filterLabel">Genre</div>
          <div className="disco__checkList">
            {facets.genres.map((g) => (
              <label key={g.name} className="disco__checkItem" onClick={() => updateParam("genre", genre === g.name ? "" : g.name)}>
                <span className={`disco__checkbox${genre === g.name ? " disco__checkbox--checked" : ""}`}>
                  {genre === g.name && <CheckIcon size={12} color="#fff" strokeWidth={3} />}
                </span>
                {g.name} · {g.count}
              </label>
            ))}
          </div>

          <div className="disco__filterLabel">Vibe</div>
          <div className="disco__chipRow">
            {facets.vibes.map((v) => (
              <button
                key={v.name}
                className={`disco__filterChip${vibe === v.name ? " disco__filterChip--active" : ""}`}
                onClick={() => updateParam("vibe", vibe === v.name ? "" : v.name)}
              >
                {v.name}
              </button>
            ))}
          </div>
        </aside>

        <main className="disco__main">
          <div className="disco__mainHead">
            <div>
              <h2 className="disco__mainTitle">{title}</h2>
              <div className="disco__mainCount">{loading ? "Loading…" : `${events.length} events`}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="disco__viewToggle">
                <span className="disco__viewToggle--active">Grid</span>
                <span>Map</span>
              </div>
              <div className="disco__sort">
                <select value={sort} onChange={(e) => updateParam("sort", e.target.value)}>
                  <option value="trending">Sort: Trending</option>
                  <option value="soonest">Sort: Soonest</option>
                  <option value="priceAsc">Sort: Price low–high</option>
                  <option value="priceDesc">Sort: Price high–low</option>
                </select>
                <ChevronDownIcon size={14} color="var(--gray-500)" />
              </div>
            </div>
          </div>

          {error && <div className="mq-state-block">Couldn't load events. {error}</div>}
          {!loading && !error && events.length === 0 && (
            <div className="mq-state-block">
              <div style={{ fontWeight: 600, fontSize: 16 }}>No events match those filters</div>
              <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Try widening your search.</div>
            </div>
          )}

          <div className="disco__grid">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="mq-skeleton" style={{ height: 300 }} />)
              : events.map((ev) => <EventCard key={ev.id} event={ev} />)}
          </div>
        </main>
      </div>
    </div>
  );
}

function EventCard({ event }) {
  const eventDate = new Date(event.date);
  const dateLabel = eventDate.toLocaleDateString("en-US", { weekday: "short" });
  const timeLabel = eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <Link to={`/events/${event.slug}`} className="disco__card">
      <div
        className="disco__cardHero"
        style={{ background: `linear-gradient(150deg, ${event.heroGradient?.from}, ${event.heroGradient?.to})` }}
      >
        <span className="disco__cardDate">
          {dateLabel} · {timeLabel}
        </span>
        {event.badge ? (
          <span className="disco__cardBadge">{event.badge.toUpperCase()}</span>
        ) : (
          <span className="disco__cardHeart">
            <HeartIcon size={16} color="#fff" strokeWidth={2} />
          </span>
        )}
        <div className="disco__cardName">{event.title.toUpperCase()}</div>
      </div>
      <div className="disco__cardBody">
        <div className="disco__cardVenue">
          {event.venue} · {event.neighborhood}
        </div>
        <div className="disco__cardLineup">{event.lineup}</div>
        <div className="disco__cardFooter">
          <span className="disco__cardPrice">
            €{event.priceFrom}
            <span className="disco__cardFrom"> from</span>
          </span>
          {event.soldOut ? (
            <span className="disco__cardGoing disco__cardGoing--low">Sold out</span>
          ) : event.lowStock ? (
            <span className="disco__cardGoing disco__cardGoing--low">Almost sold out</span>
          ) : (
            <span className="disco__cardGoing">{formatGoing(event.goingCount)} going</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatGoing(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n;
}
