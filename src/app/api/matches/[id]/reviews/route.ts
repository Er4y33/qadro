import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { parseReviews, submitReviews } from "@/lib/reviews";
import { unauthorized } from "@/lib/session";

/**
 * POST /api/matches/:id/reviews → maç sonu "Takımı Değerlendir"
 * Gövde: { reviews: [{ playerId, attended: true|false, praiseId: "taktiksel" | null }] }
 *
 * 201 Created · 400 gövde hatalı · 401 giriş yok
 * 403 Forbidden: bu maçın oyuncusu değilsin (giriş yapmışsın ama yetkin yok)
 * 404 maç yok · 409 maç henüz oynanmadı ya da zaten değerlendirdin
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id } = await params;

  const reviews = parseReviews(await request.json().catch(() => null));
  if (!reviews) return NextResponse.json({ error: "Değerlendirme listesi geçersiz." }, { status: 400 });

  const result = await submitReviews(id, viewer.id, reviews);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ xp: result.xp }, { status: 201 });
}
