import { useEffect, useState } from "react";
import OrganizerSidebar from "../../components/OrganizerSidebar.jsx";
import Badge from "../../components/Badge.jsx";
import { SearchIcon } from "../../components/icons.jsx";
import { api } from "../../api/client.js";
import "../../components/OrganizerSidebar.css";
import "./Organizer.css";
import "./Attendees.css";

const FILTERS = [
  { key: "", label: "All" },
  { key: "in", label: "Checked-in" },
  { key: "out", label: "Not in" },
  { key: "vip", label: "VIP" },
];

export default function Attendees() {
  const [workspace, setWorkspace] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [peakTime, setPeakTime] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getWorkspace().then(setWorkspace).catch(() => {});
  }, []);

  function load() {
    api
      .getAttendees({ status, q })
      .then(setData)
      .catch((err) => setError(err.message));
    api.getDoorStats().then((s) => setPeakTime(s.peakTime)).catch(() => {});
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  function exportCsv() {
    if (!data) return;
    const rows = [["Attendee", "Email", "Tier", "Ticket", "Checked in", "Status"]];
    data.rows.forEach((r) =>
      rows.push([r.name, r.email, r.tier, r.code, r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString() : "—", r.status])
    );
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendees.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="org-shell">
      <OrganizerSidebar active="attendees" workspace={workspace} />
      <div className="org-main">
        <div className="org-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <h1 className="org-topbar__title" style={{ fontSize: 23 }}>
              {data?.event?.title || "Attendees"} · Door
            </h1>
            <span className="att__live">
              <span className="att__liveDot" />
              LIVE
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="att__search">
              <SearchIcon size={16} color="var(--gray-500)" />
              <input placeholder="Search name, email or ticket ID" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="org-pillControl" style={{ cursor: "pointer" }} onClick={exportCsv}>
              Export
            </button>
          </div>
        </div>

        <div className="att__body">
          <div className="att__main">
            {error && <div className="mq-state-block">{error}</div>}
            {data && (
              <>
                <div className="att__chipRow">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      className={`att__chip${status === f.key ? " att__chip--active" : ""}`}
                      onClick={() => setStatus(f.key)}
                    >
                      {f.label} · {data.counts[f.key || "all"]}
                    </button>
                  ))}
                </div>

                <div className="mq-card" style={{ overflow: "hidden" }}>
                  <table className="mq-table">
                    <thead>
                      <tr>
                        <th>ATTENDEE</th>
                        <th>TIER</th>
                        <th>TICKET</th>
                        <th>CHECKED IN</th>
                        <th style={{ textAlign: "right" }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                              <div className={`att__avatar att__avatar--${r.status}`}>{initials(r.name)}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{r.name}</div>
                                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{r.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: "var(--gray-600)" }}>{r.tier}</td>
                          <td className="mono" style={{ color: "var(--gray-600)" }}>
                            {r.code}
                          </td>
                          <td className="mono" style={{ color: r.checkedInAt ? "var(--gray-600)" : "var(--gray-300)" }}>
                            {r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.rows.length === 0 && (
                    <div className="mq-state-block" style={{ border: "none" }}>
                      No attendees match.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="att__side">
            <div className="att__sideLabel">DOOR THROUGHPUT · LIVE</div>
            {data && (
              <>
                <div className="att__counter">
                  <div className="mono att__counterValue">
                    {data.door.checkedIn}
                    <span className="att__counterOf">/{data.door.capacity}</span>
                  </div>
                  <div className="att__counterSub">
                    checked in · {data.door.capacity ? Math.round((data.door.checkedIn / data.door.capacity) * 100) : 0}%
                  </div>
                  <div className="att__counterTrack">
                    <div
                      className="att__counterFill"
                      style={{ width: `${data.door.capacity ? (data.door.checkedIn / data.door.capacity) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", margin: "22px 0 12px" }}>By gate</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
                  {data.door.byGate.map((g) => (
                    <div key={g.gate}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span>{g.gate}</span>
                        <span className="mono" style={{ fontWeight: 700 }}>
                          {g.count}
                        </span>
                      </div>
                      <div className="att__gateTrack">
                        <div
                          className="att__gateFill"
                          style={{ width: `${data.door.capacity ? (g.count / data.door.capacity) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="att__rateCard">
                  <div>
                    <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Current rate</div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 20 }}>
                      {data.door.ratePerMinute}
                      <span style={{ fontSize: 13, color: "var(--gray-500)" }}>/min</span>
                    </div>
                  </div>
                  {peakTime && <div style={{ fontSize: 12, color: "var(--paid-text)", fontWeight: 600 }}>Peak {peakTime}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "checked_in") return <Badge tone="checkedin">In</Badge>;
  if (status === "refunded") return <Badge tone="failed" dot={false}>Refunded</Badge>;
  return <Badge tone="void" dot={false}>Not in</Badge>;
}
function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
