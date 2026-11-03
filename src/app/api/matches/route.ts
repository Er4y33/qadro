import { NextResponse } from "next/server";
import { createMatch, listMatches, validateCreateMatch } from "@/lib/matches";
import { getViewer } from "@/lib/auth";
import { unauthorized } from "@/lib/session";
import { inviteTeam } from "@/lib/teams";

/** GET /api/matches → 200 + maç listesi · 401 giriş yapılmamış */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const matches = await listMatches(viewer.id);
  return NextResponse.json(matches);
}

/**
 * POST /api/matches → yeni maç
 * 201 Created: oluşturuldu (Location başlığı yeni maçın adresini gösterir)
 * 400 Bad Request: gövde geçersiz
 * 401 Unauthorized: giriş yapılmamış
 * Gövdede teamId varsa takımın üyelerine davet gider; yanıttaki "invited" davet edilen kişi sayısıdır.
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const body = await request.json().catch(() => null);
  const result = validateCreateMatch(body);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }
  const id = await createMatch(result.value, viewer.id);
  // İsteğe bağlı: kayıtlı takımın üyelerine maç daveti (kadroya eklenmezler; davet edilir ve sohbeti görürler)
  const teamId = (body as { teamId?: unknown })?.teamId;
  let invited = 0;
  if (typeof teamId === "string" && teamId) {
    const invite = await inviteTeam(id, teamId, viewer.id);
    if (invite.ok) invited = invite.invited;
  }
  return NextResponse.json({ id, invited }, { status: 201, headers: { Location: `/api/matches/${id}` } });
}
