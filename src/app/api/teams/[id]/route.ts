import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { unauthorized } from "@/lib/session";
import { deleteTeam } from "@/lib/teams";

/** DELETE /api/teams/:id → takımı sil (yalnızca kurucu) · 204 · 403 · 404 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id } = await params;
  const result = await deleteTeam(id, viewer.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return new NextResponse(null, { status: 204 });
}
