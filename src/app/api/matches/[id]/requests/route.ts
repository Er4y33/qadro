import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { listRequests } from "@/lib/requests";
import { unauthorized } from "@/lib/session";

/**
 * GET /api/matches/:id/requests → bekleyen katılma istekleri (yalnızca organizatör)
 * 200 · 401 giriş yok · 403 organizatör değilsin · 404 maç yok
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const result = await listRequests((await params).id, viewer.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ requests: result.requests });
}
