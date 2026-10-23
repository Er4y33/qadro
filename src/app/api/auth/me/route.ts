import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteAccount, getViewer, SESSION_COOKIE, updateName } from "@/lib/auth";
import { logEvent } from "@/lib/matches";
import { unauthorized } from "@/lib/session";

/** GET /api/auth/me → 200 + giriş yapan oyuncu · 401 giriş yapılmamış */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  return NextResponse.json(viewer);
}

/** PATCH /api/auth/me { name } → 200 · 400 geçersiz ad · 401 · 403 demo hesabı */
export async function PATCH(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const result = await updateName(viewer, body.name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/auth/me { password } → 204 hesap anonimleştirildi · 401 şifre hatalı · 403 demo hesabı */
export async function DELETE(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const result = await deleteAccount(viewer, body.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  (await cookies()).delete(SESSION_COOKIE);
  await logEvent(viewer.id, "account_deleted");
  return new NextResponse(null, { status: 204 });
}
