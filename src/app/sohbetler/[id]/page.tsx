import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";
import { ChatRoom } from "@/components/ChatRoom";
import { getMessages } from "@/lib/chat";
import { getMatch } from "@/lib/matches";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Takım Sohbeti | Qadro" };

/** SSR: ilk mesajlar sunucuda okunur, sonrası istemcide yeni mesaj sorgusuyla gelir (ChatRoom). */
export const dynamic = "force-dynamic";

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer();
  const match = await getMatch(id);
  if (!match) notFound();
  const result = await getMessages(id, viewer.id);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-bg/95 px-3 pt-5 pb-3 backdrop-blur">
        <Link href="/sohbetler" aria-label="Geri" className="flex h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} />
        </Link>
        <Link href={`/mac/${match.id}`} className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{match.title}</h1>
          <p className="text-xs font-medium text-success">
            {match.dayLabel}, {match.time} • {match.format}
          </p>
        </Link>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
          {match.joined}/{match.capacity}
        </span>
      </header>

      {result.ok ? (
        <ChatRoom matchId={match.id} viewerId={viewer.id} initial={result.messages} />
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Lock size={32} className="text-muted" />
          <p className="mt-3 font-semibold">Bu sohbet kadroya özel</p>
          <p className="mt-1 text-sm text-muted">Mesajları görmek için önce maça katıl.</p>
          <Link href={`/mac/${match.id}`} className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary">
            Maça Git
          </Link>
        </main>
      )}
    </>
  );
}
