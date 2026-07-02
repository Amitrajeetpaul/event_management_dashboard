import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrganizerSidebar from "../../components/OrganizerSidebar.jsx";
import { PlusIcon, ChevronDownIcon } from "../../components/icons.jsx";
import { api } from "../../api/client.js";
import "../../components/OrganizerSidebar.css";
import "./Organizer.css";
import "./Dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getDashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  const maxDaily = data ? Math.max(1, ...data.salesOverTime.map((d) => d.ga + d.vip)) : 1;

  return (
    <div className="org-shell">
      <OrganizerSidebar active="home" workspace={data?.workspace} />
      <div className="org-main">
        <div className="org-topbar">
          <div>
            <div className="org-topbar__eyebrow">Good evening, {data?.ownerGreetingName || "…"}</div>
            <h1 className="org-topbar__title">Here's your weekend</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="org-pillControl">
              Last 30 days <ChevronDownIcon size={14} color="var(--gray-500)" />
            </div>
            <Link to="/organizer/create" className="mq-btn mq-btn--primary mq-btn--sm">
              <PlusIcon size={16} color="#fff" strokeWidth={2.4} />
              Create event
            </Link>
          </div>
        </div>

        <div className="org-content">
          {error && <div className="mq-state-block">{error}</div>}
          {!data && !error && (
            <div className="dash__kpis">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mq-skeleton" style={{ height: 110 }} />
              ))}
            </div>
          )}
          {data && (
            <>
              <div className="dash__kpis">
                <KpiCard label="Tickets sold" value={data.kpis.ticketsSold.toLocaleString()} sub="vs last 30 days" trend="up" />
                <KpiCard
                  label="Gross revenue"
                  value={`€${formatK(data.kpis.grossRevenue)}`}
                  sub={`€${formatK(data.kpis.netRevenue)} net`}
                  trend="up"
                />
                <div className="mq-card dash__kpiCard">
                  <div className="dash__kpiLabel">Checked-in tonight</div>
                  <div className="dash__kpiValue">
                    {data.kpis.checkedInTonight}
                    <span className="dash__kpiValueSub">/{data.kpis.capacityTonight}</span>
                  </div>
                  <div className="dash__progressTrack">
                    <div
                      className="dash__progressFill"
                      style={{ width: `${data.kpis.capacityTonight ? (data.kpis.checkedInTonight / data.kpis.capacityTonight) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <KpiCard label="Page views" value={formatK(data.kpis.pageViews)} sub={`${data.kpis.checkoutConversion}% → checkout`} trend="neutral" />
              </div>

              <div className="dash__grid">
                <div className="mq-card dash__chartCard">
                  <div className="dash__chartHead">
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Sales over time</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--gray-500)" }}>
                      <Legend color="var(--violet-600)" label="GA" />
                      <Legend color="var(--signal-pink)" label="VIP" />
                    </div>
                  </div>
                  <div className="dash__bars">
                    {data.salesOverTime.map((d, i) => (
                      <div key={i} className="dash__barCol">
                        <div className="dash__barStack" style={{ height: `${Math.max(4, ((d.ga + d.vip) / maxDaily) * 100)}%` }}>
                          <div className="dash__barGa" style={{ height: `${d.ga + d.vip ? (d.ga / (d.ga + d.vip)) * 100 : 0}%` }} />
                          <div className="dash__barVip" style={{ height: `${d.ga + d.vip ? (d.vip / (d.ga + d.vip)) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dash__barLabels">
                    {data.salesOverTime.map((d, i) => (
                      <span key={i}>{d.label}</span>
                    ))}
                  </div>
                </div>

                <div className="mq-card dash__activityCard">
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 18 }}>Live activity</div>
                  <div className="dash__activityList">
                    {data.activity.length === 0 && <div style={{ fontSize: 13, color: "var(--gray-500)" }}>No activity yet.</div>}
                    {data.activity.map((a, i) => (
                      <div key={i} className="dash__activityRow">
                        <span className={`dash__activityDot dash__activityDot--${a.type}`} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14 }}>{a.text}</div>
                          <div className="mono dash__activityDetail">{a.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, trend }) {
  return (
    <div className="mq-card dash__kpiCard">
      <div className="dash__kpiLabel">{label}</div>
      <div className="dash__kpiValue mono">{value}</div>
      <div className="dash__kpiSubRow">
        {trend === "up" && <span className="dash__kpiTrendUp">▲</span>}
        <span className="dash__kpiSub">{sub}</span>
      </div>
    </div>
  );
}
function Legend({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}
function formatK(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}
