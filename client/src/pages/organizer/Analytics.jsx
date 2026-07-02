import { useEffect, useMemo, useState } from "react";
import OrganizerSidebar from "../../components/OrganizerSidebar.jsx";
import { ChevronDownIcon } from "../../components/icons.jsx";
import { api } from "../../api/client.js";
import "../../components/OrganizerSidebar.css";
import "./Organizer.css";
import "./Analytics.css";

export default function Analytics() {
  const [workspace, setWorkspace] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("revenue");

  useEffect(() => {
    api.getWorkspace().then(setWorkspace).catch(() => {});
    api.listEvents({ sort: "soonest" }).then((d) => setEvents(d.events)).catch(() => {});
  }, []);

  useEffect(() => {
    api
      .getAnalytics(eventId || undefined)
      .then((d) => {
        setData(d);
        if (!eventId) setEventId(d.event.id);
      })
      .catch((err) => setError(err.message));
  }, [eventId]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Event", data.event.title],
      ["Gross revenue", data.kpis.grossRevenue],
      ["Net after fees", data.kpis.netRevenue],
      ["Avg order value", data.kpis.avgOrderValue],
      ["Refund rate %", data.kpis.refundRate],
      [],
      ["Channel", "Revenue"],
      ...data.revenueByChannel.map((c) => [c.channel, c.total]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.event.title.replace(/\s+/g, "-").toLowerCase()}-analytics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxChannel = data ? Math.max(1, ...data.revenueByChannel.map((c) => c.total)) : 1;
  const path = useMemo(() => buildPath(data?.cumulativeRevenue || []), [data]);

  return (
    <div className="org-shell">
      <OrganizerSidebar active="analytics" workspace={workspace} />
      <div className="org-main">
        <div className="org-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <h1 className="org-topbar__title" style={{ fontSize: 24 }}>
              Analytics
            </h1>
            <div className="an__segmented">
              <span className={tab === "revenue" ? "an__segmented--active" : ""} onClick={() => setTab("revenue")}>
                Revenue
              </span>
              <span className={tab === "attendance" ? "an__segmented--active" : ""} onClick={() => setTab("attendance")}>
                Attendance
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="org-pillControl">
              <select className="an__eventSelect" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={14} color="var(--gray-500)" />
            </div>
            <button className="org-pillControl" style={{ border: "1px solid var(--gray-200)", cursor: "pointer" }} onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="org-content">
          {error && <div className="mq-state-block">{error}</div>}
          {!data && !error && <div className="mq-skeleton" style={{ height: 400 }} />}

          {data && tab === "revenue" && (
            <>
              <div className="an__kpis">
                <KpiTile label="Gross revenue" value={`€${data.kpis.grossRevenue.toLocaleString()}`} />
                <KpiTile label="Net after fees" value={`€${data.kpis.netRevenue.toLocaleString()}`} sub={`€${data.kpis.feesTotal.toLocaleString()} platform + processing`} />
                <KpiTile label="Avg. order value" value={`€${data.kpis.avgOrderValue.toFixed(2)}`} />
                <KpiTile label="Refund rate" value={`${data.kpis.refundRate}%`} />
              </div>

              <div className="an__grid">
                <div className="mq-card an__chartCard">
                  <div className="an__chartHead">
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Cumulative revenue to date</div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 18, color: "var(--violet-600)" }}>
                      €{formatK(data.kpis.grossRevenue)}
                    </div>
                  </div>
                  {data.cumulativeRevenue.length > 1 ? (
                    <svg viewBox="0 0 640 210" preserveAspectRatio="none" style={{ width: "100%", height: 210 }}>
                      <defs>
                        <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#6B4EFF" stopOpacity=".22" />
                          <stop offset="1" stopColor="#6B4EFF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="52" x2="640" y2="52" stroke="#F1EFF4" strokeWidth="1" />
                      <line x1="0" y1="105" x2="640" y2="105" stroke="#F1EFF4" strokeWidth="1" />
                      <line x1="0" y1="158" x2="640" y2="158" stroke="#F1EFF4" strokeWidth="1" />
                      <path d={`${path.line} L640,210 L0,210 Z`} fill="url(#revfill)" />
                      <path d={path.line} fill="none" stroke="#6B4EFF" strokeWidth="3" strokeLinecap="round" />
                      {path.last && <circle cx={path.last[0]} cy={path.last[1]} r="5" fill="#6B4EFF" stroke="#fff" strokeWidth="2.5" />}
                    </svg>
                  ) : (
                    <div className="mq-state-block">Not enough sales yet to chart.</div>
                  )}
                </div>

                <div className="mq-card an__sideCard">
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Revenue by channel</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {data.revenueByChannel.map((c) => (
                      <div key={c.channel}>
                        <div className="an__channelRow">
                          <span style={{ color: "var(--gray-600)" }}>{c.channel}</span>
                          <span className="mono" style={{ fontWeight: 700 }}>
                            €{formatK(c.total)}
                          </span>
                        </div>
                        <div className="an__channelTrack">
                          <div className="an__channelFill" style={{ width: `${(c.total / maxChannel) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="an__funnel">
                    <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 12 }}>Sales funnel</div>
                    <FunnelRow label="Views" value={data.funnel.views.toLocaleString()} />
                    <FunnelRow label="Started checkout" value={`${data.funnel.checkoutStarts.toLocaleString()} `} pct={`${data.funnel.checkoutStartRate}%`} />
                    <FunnelRow label="Purchased" value={data.funnel.purchased.toLocaleString()} pct={`${data.funnel.purchaseRate}%`} strong />
                  </div>
                </div>
              </div>
            </>
          )}

          {data && tab === "attendance" && <AttendanceTab eventId={eventId} />}
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({ eventId }) {
  const [attendees, setAttendees] = useState(null);
  useEffect(() => {
    api.getAttendees({ eventId }).then(setAttendees).catch(() => {});
  }, [eventId]);
  if (!attendees) return <div className="mq-skeleton" style={{ height: 300 }} />;
  const pct = attendees.door.capacity ? Math.round((attendees.door.checkedIn / attendees.door.capacity) * 100) : 0;
  return (
    <div className="an__kpis">
      <KpiTile label="Checked in" value={`${attendees.door.checkedIn}/${attendees.door.capacity}`} sub={`${pct}% of capacity`} />
      {attendees.door.byGate.map((g) => (
        <KpiTile key={g.gate} label={g.gate} value={g.count} />
      ))}
    </div>
  );
}

function KpiTile({ label, value, sub }) {
  return (
    <div className="mq-card an__kpiTile">
      <div className="an__kpiLabel">{label}</div>
      <div className="mono an__kpiValue">{value}</div>
      {sub && <div className="an__kpiSub">{sub}</div>}
    </div>
  );
}
function FunnelRow({ label, value, pct, strong }) {
  return (
    <div className="an__funnelRow">
      <span style={{ color: "var(--gray-600)" }}>{label}</span>
      <span className="mono" style={{ color: strong ? "var(--paid-text)" : "inherit", fontWeight: strong ? 700 : 400 }}>
        {value} {pct && <span style={{ color: "var(--gray-500)", fontWeight: 400 }}>{pct}</span>}
      </span>
    </div>
  );
}
function formatK(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}
function buildPath(points) {
  if (!points || points.length === 0) return { line: "M0,210", last: null };
  const max = Math.max(...points.map((p) => p.total), 1);
  const w = 640;
  const h = 210;
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? w : (i / (points.length - 1)) * w;
    const y = h - (p.total / max) * (h - 20) - 4;
    return [x, y];
  });
  const line = "M" + coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
  return { line, last: coords[coords.length - 1] };
}
