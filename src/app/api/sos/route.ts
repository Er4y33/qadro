import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { unauthorized } from "@/lib/session";
import { createSos, listOpenSos } from "@/lib/sos";

/**
 * GET /api/sos → giriş yapan oyuncuya açık S.O.S çağrıları
 * POST /api/sos → çağrı başlat. Gövde: { matchId, position }
 * 201 Created · 400 gövde hatalı · 401 giriş yok · 403 kadroda değilsin · 404 maç yok · 409 kadro tam ya da açık çağrı var
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  return NextResponse.json({ calls: await listOpenSos(viewer.id) });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { matchId?: unknown; position?: unknown };
  if (typeof body.matchId !== "string" || typeof body.position !== "string") {
    return NextResponse.json({ error: "Maç ve mevki gerekli." }, { status: 400 });
  }
  const result = await createSos(body.matchId, viewer.id, body.position);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
