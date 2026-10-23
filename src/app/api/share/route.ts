import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { logEvent } from "@/lib/matches";

/**
 * POST /api/share { path } → paylaşımı olay günlüğüne yazar (dashboard: "Başarı paylaşımı")
 * 204 No Content. Giriş yapmamış ziyaretçinin paylaşımı da kaydedilir (oyuncu boş).
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  const body = (await request.json().catch(() => ({}))) as { path?: unknown };
  const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 100) : null;
  await logEvent(viewer?.id ?? null, "achievement_shared", undefined, { path });
  return new NextResponse(null, { status: 204 });
}
