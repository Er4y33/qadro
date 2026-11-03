import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { unauthorized } from "@/lib/session";
import { createTeam, listTeams, validateTeam } from "@/lib/teams";

/** GET /api/teams → üyesi olduğun takımlar · 401 giriş yok */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  return NextResponse.json(await listTeams(viewer.id));
}

/**
 * POST /api/teams → yeni takım (kayıtlı kadro)
 * Gövde: { name, sport, memberIds: string[] }
 * 201 Created · 400 geçersiz gövde ya da birlikte oynamadığın oyuncu · 401 giriş yok
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const parsed = validateTeam(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  const result = await createTeam(viewer.id, parsed.value);
  if (!result.ok) return NextResponse.json({ errors: [result.error] }, { status: result.status });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
