import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import { LineupPicker } from "@/components/LineupPicker";
import { getMatch } from "@/lib/matches";
import { CURRENT_PLAYER_ID } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  return (
    <main className="flex flex-1 flex-col pb-6">
      <ScreenHeader title="Saha Dizilimi" backHref={`/mac/${match.id}`} />
      <div className="flex items-center justify-between px-5 text-sm">
        <span className="text-muted">{match.title}</span>
        <span className="font-semibold text-success">{match.format} Taktik</span>
      </div>
      <LineupPicker
        matchId={match.id}
        lineup={match.lineup}
        sport={match.sport}
        alreadyJoined={match.participants.some((p) => p.id === CURRENT_PLAYER_ID)}
        full={match.joined >= match.capacity}
      />
    </main>
  );
}
