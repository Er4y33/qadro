import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { unauthorized } from "@/lib/session";
import { answerSos } from "@/lib/sos";

/**
 * POST /api/sos/:id/answer → S.O.S çağrısını kabul et, maçın kadrosuna katıl
 * 201 Created · 401 giriş yok · 404 çağrı yok · 409 başkası yanıtladı, süre doldu ya da maç doldu
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id } = await params;
  const result = await answerSos(id, viewer.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ matchId: result.matchId, xp: result.xp }, { status: 201 });
}
