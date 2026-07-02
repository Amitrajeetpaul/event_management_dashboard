import { useEffect, useState } from "react";
import Logo from "../../components/Logo.jsx";
import { CheckIcon, XIcon, AlertIcon } from "../../components/icons.jsx";
import { api } from "../../api/client.js";
import "./Scanner.css";

const STAFF_NAME = "Malik";
const GATES = ["Gate A · main", "Gate B · guest", "VIP entrance"];

export default function Scanner() {
  const [gate, setGate] = useState(GATES[0]);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState(null);

  function loadStats() {
    api.getDoorStats().then(setStats).catch(() => {});
  }
  useEffect(() => {
    loadStats();
    const id = setInterval(loadStats, 5000);
    return () => clearInterval(id);
  }, []);

  async function handleScan(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.scanTicket({ code: code.trim(), gate, staffName: STAFF_NAME });
      setResult(res);
      loadStats();
    } catch (err) {
      setResult({ result: "invalid", message: err.message });
    } finally {
      setSubmitting(false);
      setCode("");
    }
  }

  function scanNext() {
    setResult(null);
  }

  return (
    <div className="scn">
      <div className="scn__header">
        <Logo size={26} dark suffix="Door" />
        <div className="scn__eventLine">
          {stats?.event?.title || "Loading event…"} · {gate} · Staff: {STAFF_NAME}
        </div>
      </div>

      <div className="scn__layout">
        <div className="scn__phone">
          {!result ? (
            <ScanningPanel gate={gate} setGate={setGate} code={code} setCode={setCode} onSubmit={handleScan} submitting={submitting} stats={stats} />
          ) : (
            <ResultPanel result={result} onNext={scanNext} />
          )}
        </div>

        <div className="scn__side">
          <div className="scn__attendanceCard">
            <div className="scn__sideLabel">ATTENDANCE OVERVIEW</div>
            {stats && (
              <>
                <div className="scn__pctRow">
                  <span className="mono scn__pct">{stats.capacity ? Math.round((stats.checkedIn / stats.capacity) * 100) : 0}%</span>
                  <span className="scn__pctSub">of capacity in</span>
                </div>
                <div className="scn__pctTrack">
                  <div className="scn__pctFill" style={{ width: `${stats.capacity ? (stats.checkedIn / stats.capacity) * 100 : 0}%` }} />
                </div>
                <StatRow label="My scans tonight" value={stats.myScans} />
                <StatRow label="Rejected" value={stats.rejected} warn />
                {stats.peakTime && <StatRow label="Peak time" value={stats.peakTime} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanningPanel({ gate, setGate, code, setCode, onSubmit, submitting, stats }) {
  return (
    <div className="scn__panel">
      <div className="scn__panelTop">
        <span className="mono">{new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
        <span className="scn__online">
          <span className="scn__onlineDot" />
          Online
        </span>
      </div>
      <div style={{ padding: "6px 22px 16px" }}>
        <div className="scn__scanningLabel">SCANNING · {gate}</div>
        <div style={{ fontWeight: 600, fontSize: 19, marginTop: 2 }}>Point at ticket QR</div>
      </div>
      <div className="scn__frame">
        <div className="scn__reticle">
          <span className="scn__corner scn__corner--tl" />
          <span className="scn__corner scn__corner--tr" />
          <span className="scn__corner scn__corner--bl" />
          <span className="scn__corner scn__corner--br" />
          <span className="scn__scanline" />
        </div>
      </div>
      <form className="scn__manualEntry" onSubmit={onSubmit}>
        <select className="scn__gateSelect" value={gate} onChange={(e) => setGate(e.target.value)}>
          {GATES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <input
          className="scn__codeInput mono"
          placeholder="Enter ticket code · MQ-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
        />
        <button className="mq-btn mq-btn--primary mq-btn--full" disabled={submitting || !code.trim()}>
          {submitting ? "Checking…" : "Scan"}
        </button>
      </form>
      <div className="scn__statsRow">
        <div className="scn__statTile">
          <div className="mono scn__statValue">{stats?.checkedIn ?? "—"}</div>
          <div className="scn__statLabel">Checked in</div>
        </div>
        <div className="scn__statTile">
          <div className="mono scn__statValue">{stats?.remaining ?? "—"}</div>
          <div className="scn__statLabel">Remaining</div>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, onNext }) {
  if (result.result === "admit") {
    return (
      <div className="scn__panel scn__panel--success">
        <div className="scn__resultGlow" />
        <div className="scn__panelTop" style={{ position: "relative" }}>
          <span className="mono">{new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
          <span>{result.stats?.checkedIn != null ? `${result.stats.checkedIn}/${result.stats.capacity}` : ""}</span>
        </div>
        <div className="scn__resultBody">
          <div className="scn__resultIcon scn__resultIcon--success">
            <CheckIcon size={52} color="#fff" strokeWidth={2.6} />
          </div>
          <div className="scn__resultTitle">Valid ticket</div>
          <div className="scn__resultSub scn__resultSub--success">Admit to floor</div>
          <div className="scn__resultCard">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="scn__resultAvatar">{initials(result.holderName)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17, color: "#fff" }}>{result.holderName}</div>
                <div style={{ fontSize: 13, color: "#9fe6d2" }}>{result.tierName}</div>
              </div>
            </div>
            <div className="scn__resultCardFoot">
              <span>Ticket</span>
              <span className="mono" style={{ color: "#fff" }}>
                {result.code}
              </span>
            </div>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <button className="scn__nextBtn scn__nextBtn--success" onClick={onNext}>
            Admit · scan next
          </button>
        </div>
      </div>
    );
  }

  if (result.result === "already_scanned") {
    return (
      <div className="scn__panel scn__panel--dark">
        <ErrorCard
          icon={<XIcon size={24} color="#fff" strokeWidth={2.6} />}
          tone="error"
          title="Already scanned"
          sub={`Entered ${result.checkedInAt ? new Date(result.checkedInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""} · ${result.gate || ""}`}
          note="ERROR STATE · pass-back blocked"
        />
        <div style={{ padding: 22 }}>
          <button className="scn__nextBtn" onClick={onNext}>
            Scan next
          </button>
        </div>
      </div>
    );
  }

  if (result.result === "wrong_event") {
    return (
      <div className="scn__panel scn__panel--dark">
        <ErrorCard
          icon={<AlertIcon size={24} color="#fff" strokeWidth={2.4} />}
          tone="warn"
          title="Wrong event"
          sub={result.message}
        />
        <div style={{ padding: 22 }}>
          <button className="scn__nextBtn" onClick={onNext}>
            Scan next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scn__panel scn__panel--dark">
      <ErrorCard icon={<XIcon size={24} color="#fff" strokeWidth={2.6} />} tone="error" title="Invalid ticket" sub={result.message || "This code isn't recognized"} />
      <div style={{ padding: 22 }}>
        <button className="scn__nextBtn" onClick={onNext}>
          Scan next
        </button>
      </div>
    </div>
  );
}

function ErrorCard({ icon, tone, title, sub, note }) {
  return (
    <div style={{ padding: 22, flex: 1 }}>
      <div className={`scn__errorBox scn__errorBox--${tone}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className={`scn__errorIcon scn__errorIcon--${tone}`}>{icon}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17, color: "#fff" }}>{title}</div>
            <div className={`scn__errorSub scn__errorSub--${tone}`}>{sub}</div>
          </div>
        </div>
        {note && <div className="scn__errorNote">{note}</div>}
      </div>
    </div>
  );
}

function StatRow({ label, value, warn }) {
  return (
    <div className="scn__statRow">
      <span>{label}</span>
      <span className="mono" style={{ color: warn ? "#F0A79F" : "#fff", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}
function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
