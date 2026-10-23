import { NextResponse } from "next/server";
import { getMatch, joinMatch, leaveMatch } from "@/lib/matches";
import { getViewer } from "@/lib/auth";
import { cancelRequest, removeParticipant, requestToJoin } from "@/lib/requests";
import { unauthorized } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/matches/:id/participants → maça katıl
 * 201 Created: kadroya eklendin
 * 202 Accepted: maç onaylı katılımlı; isteğin organizatöre iletildi, sonuç sonra belli olacak
 * 401 giriş yok · 404 maç yok · 409 Conflict: maç dolu, zaten kadrodasın ya da isteğin zaten var / reddedildi
 * Gövde (isteğe bağlı): { position: "OS", x: 50, y: 50 } → sahada seçilen bölge
 */
export async function POST(request: Request, { params }: Params) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { position?: unknown; x?: unknown; y?: unknown };
  const slot =
    typeof body.position === "string" && typeof body.x === "number" && typeof body.y === "number"
      ? { position: body.position.slice(0, 8), x: body.x, y: body.y }
      : undefined;

  const match = await getMatch(id);
  if (!match) return NextResponse.json({ error: "Maç bulunamadı." }, { status: 404 });
  const member = match.participants.some((p) => p.id === viewer.id);

  if (match.requiresApproval && !member && match.organizer.id !== viewer.id) {
    if (match.joined >= match.capacity) return NextResponse.json({ error: "Maç dolu." }, { status: 409 });
    const result = await requestToJoin(id, viewer.id, slot);
    if (result === "requested") return NextResponse.json({ status: "requested" }, { status: 202 });
    return NextResponse.json(
      { error: result === "declined_before" ? "Organizatör bu maç için isteğini kabul etmedi." : "İsteğin zaten organizatörde, onay bekliyor." },
      { status: 409 },
    );
  }

  const result = await joinMatch(id, viewer.id, slot);
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
 * DELETE /api/matches/:id/participants → maçtan ayrıl ya da bekleyen katılma isteğini geri çek
 * DELETE /api/matches/:id/participants?player=<id> → organizatör bir oyuncuyu kadrodan çıkarır ("Onaylanan Kadro")
 * 204 No Content · 401 giriş yok · 403 organizatör değilsin · 404 maç yok ya da kadroda değil · 409 organizatör ayrılamaz
 */
export async function DELETE(request: Request, { params }: Params) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id } = await params;

  const target = new URL(request.url).searchParams.get("player");
  if (target && target !== viewer.id) {
    const result = await removeParticipant(id, viewer.id, target);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return new NextResponse(null, { status: 204 });
  }

  if (await cancelRequest(id, viewer.id)) return new NextResponse(null, { status: 204 });
  const result = await leaveMatch(id, viewer.id);
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
