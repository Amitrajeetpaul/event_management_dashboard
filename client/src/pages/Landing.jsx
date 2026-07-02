import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { SearchIcon } from "../components/icons.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Landing.css";

const TILE_ROTATION = [0, 1, 0, 1, 0, 1];

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [trending, setTrending] = useState([]);
  const [genre, setGenre] = useState("");

  useEffect(() => {
    api
      .listEvents({ sort: "trending" })
      .then((data) => setTrending(data.events.slice(0, 6)))
      .catch(() => setTrending([]));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/discover${genre ? `?genre=${encodeURIComponent(genre)}` : ""}`);
  }

  return (
    <div className="landing">
      <header className="landing__header">
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <Logo size={32} dark />
          <nav className="landing__nav">
            <Link to="/discover" style={{ color: "#fff" }}>
              Discover
            </Link>
            <span>Cities</span>
            <Link to="/organizer">For organizers</Link>
            <span>Pricing</span>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <>
              <span className="landing__loginLink" style={{ color: "#fff", fontWeight: 600 }}>
                {user.name}
              </span>
              <Link to="/organizer" className="mq-btn mq-btn--primary mq-btn--sm">
                Dashboard
              </Link>
              <button
                className="mq-btn mq-btn--secondary mq-btn--sm"
                style={{ padding: "8px 12px", background: "transparent", color: "#cfcbd6", border: "1px solid rgba(255,255,255,0.15)" }}
                onClick={logout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="landing__loginLink">
                Log in
              </Link>
              <Link to="/register" className="mq-btn mq-btn--primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="landing__hero">
        <div className="landing__tiles" aria-hidden="true">
          {trending.map((ev, i) => (
            <Link
              key={ev.id}
              to={`/events/${ev.slug}`}
              className="landing__tile"
              style={{
                background: `linear-gradient(160deg, ${ev.heroGradient?.from || "#6B4EFF"}, ${ev.heroGradient?.to || "#2A1C6E"})`,
                marginTop: TILE_ROTATION[i % TILE_ROTATION.length] ? 34 : 0,
              }}
            >
              {ev.title.toUpperCase()}
            </Link>
          ))}
        </div>

        <div className="landing__badge">
          <span className="landing__pulseDot" />
          3,400 events live this weekend
        </div>
        <h1 className="landing__headline">
          Find where
          <br />
          the night goes.
        </h1>
        <p className="landing__sub">
          Club nights, warehouse raves, rooftop sets and festivals — discover, book and get straight through the
          door.
        </p>

        <form className="landing__search" onSubmit={handleSearch}>
          <div className="landing__searchField">
            <div className="landing__searchLabel">CITY</div>
            <div className="landing__searchValue">Berlin</div>
          </div>
          <div className="landing__searchField">
            <div className="landing__searchLabel">WHEN</div>
            <div className="landing__searchValue">This weekend</div>
          </div>
          <div className="landing__searchField landing__searchField--last">
            <div className="landing__searchLabel">GENRE</div>
            <select
              className="landing__genreSelect"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">Any</option>
              <option value="Techno">Techno</option>
              <option value="House">House</option>
            </select>
          </div>
          <button type="submit" className="landing__searchBtn" aria-label="Search">
            <SearchIcon size={22} color="#fff" strokeWidth={2.2} />
          </button>
        </form>

        <div className="landing__popular">
          <span style={{ color: "#8B8794", fontSize: 14 }}>Popular:</span>
          <Link to="/discover?genre=Techno" className="landing__chip">
            Techno
          </Link>
          <Link to="/discover?vibe=Rooftop" className="landing__chip">
            Rooftop
          </Link>
          <Link to="/discover" className="landing__chip">
            Afrobeats
          </Link>
          <Link to="/discover" className="landing__chip">
            Free entry
          </Link>
        </div>
      </div>
    </div>
  );
}
