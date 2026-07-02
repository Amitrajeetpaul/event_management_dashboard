const BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("mq_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    const message = body?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getMe: () => request("/auth/me"),
  listEvents: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return request(`/events${qs ? `?${qs}` : ""}`);
  },
  getEvent: (slug) => request(`/events/${slug}`),
  checkout: (payload) => request("/checkout", { method: "POST", body: JSON.stringify(payload) }),
  getWallet: (email) => request(`/wallet${email ? `?email=${encodeURIComponent(email)}` : ""}`),
  getTicket: (code) => request(`/wallet/ticket/${code}`),
  getWorkspace: () => request("/organizer/workspace"),
  getDashboard: () => request("/organizer/dashboard"),
  createEvent: (payload) => request("/organizer/events", { method: "POST", body: JSON.stringify(payload) }),
  getAnalytics: (eventId) => request(`/organizer/analytics${eventId ? `?eventId=${eventId}` : ""}`),
  getAttendees: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return request(`/organizer/attendees${qs ? `?${qs}` : ""}`);
  },
  scanTicket: (payload) => request("/door/scan", { method: "POST", body: JSON.stringify(payload) }),
  getDoorStats: () => request("/door/stats"),
};
