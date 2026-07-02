import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ChevronLeftIcon, TicketIcon, CheckIcon } from "../components/icons.jsx";
import { api } from "../api/client.js";
import "./Wallet.css";

export default function Wallet() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "amara.okafor@gmail.com";
  const justPaid = searchParams.get("justPaid") === "1";

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [selectedCode, setSelectedCode] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);

  useEffect(() => {
    api
      .getWallet(email)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [email]);

  useEffect(() => {
    if (!selectedCode) return;
    setTicketDetail(null);
    api.getTicket(selectedCode).then(setTicketDetail).catch(() => setTicketDetail(null));
  }, [selectedCode]);

  if (selectedCode) {
    return <TicketDetail detail={ticketDetail} onBack={() => setSelectedCode(null)} />;
  }

  return (
    <div className="wallet">
      <div className="wallet__col">
        <div className="wallet__header">
          <h1>My tickets</h1>
          <div className="wallet__tabs">
            <button className={tab === "upcoming" ? "wallet__tab--active" : ""} onClick={() => setTab("upcoming")}>
              Upcoming
            </button>
            <button className={tab === "past" ? "wallet__tab--active" : ""} onClick={() => setTab("past")}>
              Past
            </button>
          </div>
        </div>

        {justPaid && (
          <div className="wallet__successBanner">
            <CheckIcon size={18} color="var(--paid)" strokeWidth={2.4} />
            Your tickets are ready — QR codes below.
          </div>
        )}

        {error && <div className="mq-state-block">Couldn't load your wallet. {error}</div>}

        {data && tab === "upcoming" && (
          data.upcoming.length ? (
            <div className="wallet__list">
              {data.upcoming.map((t) => (
                <WalletCard key={t.eventId} entry={t} onShowQR={() => setSelectedCode(t.firstCode)} />
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming tickets" sub="When you book a night out, it'll show up here." />
          )
        )}

        {data && tab === "past" && (
          data.past.length ? (
            <div className="wallet__list">
              {data.past.map((t) => (
                <WalletCard key={t.eventId} entry={t} past />
              ))}
            </div>
          ) : (
            <EmptyState message="No past events yet" sub="When you've been to a night, it'll show here with your receipt." />
          )
        )}

        <div className="wallet__paymentHistory">
          <div className="wallet__sectionLabel">PAYMENT HISTORY</div>
          {data && data.paymentHistory.length ? (
            data.paymentHistory.map((p) => (
              <div key={p.id} className="wallet__paymentRow">
                <div>
                  <div className="wallet__paymentTitle">{p.title}</div>
                  <div className="wallet__paymentMeta">
                    {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {p.method}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono wallet__paymentAmount" style={{ color: p.status === "refunded" ? "var(--gray-500)" : "var(--ink)" }}>
                    €{p.total.toFixed(2)}
                  </div>
                  <span className={`wallet__paymentStatus wallet__paymentStatus--${p.status}`}>
                    {p.status === "refunded" ? "Refunded" : "Paid"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: "var(--gray-500)", padding: "12px 0" }}>No payments yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function WalletCard({ entry, past, onShowQR }) {
  const eventDate = new Date(entry.date);
  const now = new Date();
  const isToday = eventDate.toDateString() === now.toDateString();
  const daysUntil = Math.ceil((eventDate - now) / 86400000);
  const dateLabel = isToday
    ? `TONIGHT · ${entry.doorsTimeLabel}`.toUpperCase()
    : `${eventDate.toLocaleDateString("en-US", { weekday: "short" })} · ${entry.doorsTimeLabel}`.toUpperCase();

  return (
    <div className="wallet__card">
      <div
        className="wallet__cardHero"
        style={{ background: `linear-gradient(150deg, ${entry.heroGradient?.from}, ${entry.heroGradient?.to})` }}
      >
        <span className="wallet__cardDate">{dateLabel}</span>
        <span className="wallet__cardTitle">{entry.title.toUpperCase()}</span>
      </div>
      <div className="wallet__cardBody">
        <div className="wallet__cardVenue">
          {entry.venue} · {entry.neighborhood}
        </div>
        <div className="wallet__cardFooter">
          <span className="wallet__cardTier">{entry.tierSummary}</span>
          {past ? (
            <span className="wallet__cardPast">Attended</span>
          ) : isToday ? (
            <button type="button" className="wallet__cardQR" onClick={onShowQR}>
              Show QR →
            </button>
          ) : (
            <span className="wallet__cardIn">
              in {daysUntil} day{daysUntil === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, sub }) {
  return (
    <div className="wallet__empty">
      <div className="wallet__emptyIcon">
        <TicketIcon size={26} color="var(--gray-500)" strokeWidth={1.8} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16 }}>{message}</div>
      <div style={{ fontSize: 13, color: "var(--gray-500)", margin: "6px 0 16px", lineHeight: 1.5 }}>{sub}</div>
      <Link to="/discover" className="mq-btn mq-btn--primary mq-btn--sm">
        Find events
      </Link>
    </div>
  );
}

function TicketDetail({ detail, onBack }) {
  return (
    <div className="wallet wallet--detail">
      <div className="wallet__col">
        <button className="wallet__back" onClick={onBack}>
          <ChevronLeftIcon size={16} color="#cfcbd6" strokeWidth={2.2} />
          Back
        </button>
        {!detail ? (
          <div className="mq-skeleton" style={{ height: 400, marginTop: 20 }} />
        ) : (
          <>
            <div className="wallet__detailHead">
              <div className="wallet__detailTitle">{detail.event.title}</div>
              <div className="wallet__detailMeta">
                {new Date(detail.event.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} · {detail.event.venue}
              </div>
            </div>
            <div className="wallet__qrCard">
              <QRCodeSVG value={`MARQUEE:${detail.code}`} size={200} bgColor="#ffffff" fgColor="#16141D" level="M" />
              <div className="wallet__qrCode">{detail.code}</div>
              <div className="wallet__qrSub">{detail.indexLabel}</div>
            </div>
            <div className="wallet__validPill">
              <span className={`wallet__validDot wallet__validDot--${detail.status}`} />
              {detail.status === "checked_in" ? "Checked in" : "Valid · not yet scanned"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
