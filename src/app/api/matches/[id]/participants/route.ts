import { NextResponse } from "next/server";
import { joinMatch, leaveMatch } from "@/lib/matches";
import { CURRENT_PLAYER_ID } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/matches/:id/participants → maça katıl
 * 201 Created · 404 maç yok · 409 Conflict: maç dolu ya da zaten kadrodasın
 * Gövde (isteğe bağlı): { position: "OS", x: 50, y: 50 } → sahada seçilen bölge
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { position?: unknown; x?: unknown; y?: unknown };
  const slot =
    typeof body.position === "string" && typeof body.x === "number" && typeof body.y === "number"
      ? { position: body.position.slice(0, 8), x: body.x, y: body.y }
      : undefined;

  const result = await joinMatch(id, CURRENT_PLAYER_ID, slot);
  switch (result) {
    case "joined":
      return NextResponse.json({ status: "joined" }, { status: 201 });
    case "not_found":
      return NextResponse.json({ error: "Maç bulunamadı." }, { status: 404 });
    case "already_joined":
      return NextResponse.json({ error: "Zaten bu maçın kadrosundasın." }, { status: 409 });
    case "full":
      return NextResponse.json({ error: "Maç dolu, son yer başkası tarafından alındı." }, { status: 409 });
  }
}

/**
 * DELETE /api/matches/:id/participants → maçtan ayrıl
 * 204 No Content · 404 maç yok ya da kadroda değilsin · 409 organizatör ayrılamaz
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await leaveMatch(id, CURRENT_PLAYER_ID);
  switch (result) {
    case "left":
      return new NextResponse(null, { status: 204 });
    case "not_found":
      return NextResponse.json({ error: "Maç bulunamadı." }, { status: 404 });
    case "not_member":
      return NextResponse.json({ error: "Bu maçın kadrosunda değilsin." }, { status: 404 });
    case "organizer":
      return NextResponse.json({ error: "Organizatör kendi maçından ayrılamaz." }, { status: 409 });
  }
}
