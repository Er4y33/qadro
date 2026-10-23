import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { ScreenHeader } from "@/components/ui";
import { RequestsManager } from "@/components/RequestsManager";
import { getMatch } from "@/lib/matches";
import { listRequests } from "@/lib/requests";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "İstekleri Yönet | Qadro" };

/** SSR: bekleyen istekler ve kadro her açılışta güncel okunur. Yalnızca organizatör görebilir. */
export const dynamic = "force-dynamic";

export default async function RequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer();
  const match = await getMatch(id);
  if (!match) notFound();
  const result = await listRequests(id, viewer.id);

  return (
    <main className="flex-1 pb-12">
      <ScreenHeader title={match.requiresApproval ? "İstekleri Yönet" : "Kadroyu Yönet"} backHref={`/mac/${id}`} />
      {result.ok ? (
        <RequestsManager
          matchId={id}
          matchTitle={match.title}
          capacity={match.capacity}
          requiresApproval={match.requiresApproval}
          requests={result.requests}
          roster={match.participants.map((p) => ({
            ...p,
            position: match.lineup.find((s) => s.player.id === p.id)?.position ?? null,
            organizer: p.id === match.organizer.id,
          }))}
        />
      ) : (
        <div className="flex flex-col items-center px-8 pt-20 text-center">
          <Lock size={32} className="text-muted" />
          <p className="mt-3 font-semibold">Bu ekran organizatöre özel</p>
          <Link href={`/mac/${id}`} className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary">
            Maça Dön
          </Link>
        </div>
      )}
    </main>
  );
}
