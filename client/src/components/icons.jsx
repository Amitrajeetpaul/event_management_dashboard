// Icon set traced from the design deck: 1.75–2px stroke, rounded joins, 24px viewbox.
const base = (props) => ({
  width: props.size ?? 18,
  height: props.size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: props.color ?? "currentColor",
  strokeWidth: props.strokeWidth ?? 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const CalendarIcon = (p) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <path d="M8 2v4M16 2v4M3 10h18" />
  </svg>
);
export const SearchIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);
export const PinIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-4.6-7-10a7 7 0 0 1 14 0c0 5.4-7 10-7 10Z" />
    <circle cx="12" cy="11" r="2.5" />
  </svg>
);
export const UsersIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0M16 6.5a3 3 0 0 1 0 5.5M15 20a6 6 0 0 0-1-3.3" />
  </svg>
);
export const ChevronDownIcon = (p) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const ChevronLeftIcon = (p) => (
  <svg {...base(p)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
export const CheckIcon = (p) => (
  <svg {...base(p)}>
    <path d="M5 12l4 4L19 6" />
  </svg>
);
export const XIcon = (p) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const PlusIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const TicketIcon = (p) => (
  <svg {...base(p)}>
    <path d="M3 8h18v3a2 2 0 0 0 0 2v3H3v-3a2 2 0 0 0 0-2z" />
  </svg>
);
export const HomeIcon = (p) => (
  <svg {...base(p)}>
    <path d="M3 11l9-7 9 7M5 10v9h14v-9" />
  </svg>
);
export const AnalyticsIcon = (p) => (
  <svg {...base(p)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
export const PayoutsIcon = (p) => (
  <svg {...base(p)}>
    <rect x="2" y="6" width="20" height="13" rx="2.5" />
    <path d="M2 10h20" />
  </svg>
);
export const ShieldIcon = (p) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const AlertIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 8v5M12 16h.01" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);
export const HeartIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-4.6-7-10a4.5 4.5 0 0 1 7-3.7A4.5 4.5 0 0 1 19 11c0 5.4-7 10-7 10Z" />
  </svg>
);
