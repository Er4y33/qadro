import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { changePassword, getViewer, SESSION_COOKIE } from "@/lib/auth";
import { unauthorized } from "@/lib/session";

/**
 * POST /api/auth/password { current, next }
 * 200 şifre değişti (diğer cihazlardaki oturumlar kapandı) · 400 yeni şifre kısa · 401 mevcut şifre hatalı · 403 demo hesabı
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { current?: unknown; next?: unknown };
  // Bu cihazdaki oturum açık kalır, diğerleri kapanır
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  const result = await changePassword(viewer, body.current, body.next, token);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
