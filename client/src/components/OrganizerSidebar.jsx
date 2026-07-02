import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import { HomeIcon, CalendarIcon, TicketIcon, UsersIcon, AnalyticsIcon, PayoutsIcon, ChevronDownIcon } from "./icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { key: "home", label: "Home", icon: HomeIcon, to: "/organizer" },
  { key: "events", label: "Events", icon: CalendarIcon, to: "/organizer/create" },
  { key: "tickets", label: "Tickets", icon: TicketIcon, to: "/organizer/create" },
  { key: "attendees", label: "Attendees", icon: UsersIcon, to: "/organizer/attendees" },
  { key: "analytics", label: "Analytics", icon: AnalyticsIcon, to: "/organizer/analytics" },
  { key: "payouts", label: "Payouts", icon: PayoutsIcon, to: "/organizer/attendees" },
];

export default function OrganizerSidebar({ active, workspace }) {
  const { logout } = useAuth();
  return (
    <aside className="org-sidebar">
      <div style={{ padding: "0 8px 22px" }}>
        <Logo size={30} dark />
      </div>
      <div className="org-sidebar__workspace">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            className="org-sidebar__avatar"
            style={{ background: workspace?.avatarColor || "var(--signal-pink)" }}
          >
            {workspace?.avatarInitial || "W"}
          </div>
          <span style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>{workspace?.name || "Workspace"}</span>
        </div>
        <ChevronDownIcon size={14} color="#8B8794" />
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <Link key={item.key} to={item.to} className={`org-sidebar__link${isActive ? " org-sidebar__link--active" : ""}`}>
              <Icon size={18} color={isActive ? "#fff" : "#9E9AA6"} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="org-sidebar__user" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
        <div className="org-sidebar__avatar org-sidebar__avatar--user">{workspace?.ownerInitials || "?"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{workspace?.ownerName || ""}</div>
          <div style={{ fontSize: 11, color: "#8B8794" }}>{workspace?.ownerRole || ""}</div>
        </div>
        <button
          onClick={logout}
          style={{
            background: "transparent",
            border: "none",
            color: "#ff4d8d",
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 8px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
