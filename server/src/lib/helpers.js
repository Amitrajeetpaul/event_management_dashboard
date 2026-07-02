import Workspace from "../models/Workspace.js";
import Event from "../models/Event.js";

// This is a single-tenant demo: there is exactly one workspace (Warehouse 09) and
// no auth, so every organizer/staff route resolves against it directly.
export async function getWorkspace() {
  const workspace = await Workspace.findOne();
  if (!workspace) throw new Error("No workspace seeded — run `npm run seed`.");
  return workspace;
}

// "Tonight's" event: the live event whose date falls within today. Falls back to
// the soonest upcoming event so the door/dashboard screens always have something live.
export async function getActiveEvent(workspaceId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const tonight = await Event.findOne({
    workspace: workspaceId,
    status: "live",
    date: { $gte: startOfDay, $lt: endOfDay },
  }).sort({ date: 1 });
  if (tonight) return tonight;

  return Event.findOne({ workspace: workspaceId, status: "live" }).sort({ date: 1 });
}

export function money(n) {
  return Math.round(n * 100) / 100;
}
