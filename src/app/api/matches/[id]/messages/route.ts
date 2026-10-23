import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { getMessages, sendMessage } from "@/lib/chat";
import { unauthorized } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/matches/:id/messages?after=<id> → takım sohbetinin mesajları (after verilirse yalnızca yeniler)
 * 200 OK · 401 giriş yok · 403 kadroda değilsin · 404 maç yok
 */
export async function GET(request: Request, { params }: Params) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id } = await params;
  const after = Number(new URL(request.url).searchParams.get("after") ?? 0);
  const result = await getMessages(id, viewer.id, Number.isSafeInteger(after) && after > 0 ? after : 0);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ messages: result.messages }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/matches/:id/messages  { body: "Ben kaleye geçerim" }
 * 201 Created · 400 boş ya da 500 karakterden uzun · 401 · 403 · 404
 */
export async function POST(request: Request, { params }: Params) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const { id } = await params;
  const json = (await request.json().catch(() => ({}))) as { body?: unknown };
  const result = await sendMessage(id, viewer.id, json.body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ message: result.message }, { status: 201 });
}
