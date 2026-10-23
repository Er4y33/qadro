import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { listNotifications, markNotificationsSeen } from "@/lib/notifications";
import { unauthorized } from "@/lib/session";

/** GET /api/notifications → 200 bildirim listesi (en yeni başta) · 401 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  return NextResponse.json({ notifications: await listNotifications(viewer.id) }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/notifications → tümünü okundu işaretle · 204 · 401 */
export async function POST() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  await markNotificationsSeen(viewer.id);
  return new NextResponse(null, { status: 204 });
}
