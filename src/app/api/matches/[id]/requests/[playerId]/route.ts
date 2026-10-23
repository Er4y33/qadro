import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { decideRequest } from "@/lib/requests";
import { unauthorized } from "@/lib/session";

/**
 * PATCH /api/matches/:id/requests/:playerId { decision: "approve" | "decline" }
 * 200 karar kaydedildi · 400 geçersiz karar · 401 · 403 organizatör değilsin · 404 bekleyen istek yok · 409 kadro dolu
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; playerId: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id, playerId } = await params;
  const body = (await request.json().catch(() => ({}))) as { decision?: unknown };
  const result = await decideRequest(id, viewer.id, playerId, body.decision);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
