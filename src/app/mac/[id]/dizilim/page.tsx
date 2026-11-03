import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import { LineupPicker } from "@/components/LineupPicker";
import { getMatch } from "@/lib/matches";
import { COURT_TITLE } from "@/lib/courts";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer();
  const match = await getMatch(id);
  if (!match) notFound();

  return (
    <main className="flex flex-1 flex-col pb-6">
      <ScreenHeader title={match.venueShort} backHref={`/mac/${match.id}`} />
      <div className="-mt-2 text-center text-sm">
        <p className="font-semibold text-primary">
          {match.dayLabel}, {match.time} • {match.sport === "tenis" ? match.format : match.format.replace("v", "×")}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {COURT_TITLE[match.sport]} · {match.title}
        </p>
      </div>
      <LineupPicker
        matchId={match.id}
        lineup={match.lineup}
        sport={match.sport}
        format={match.format}
        viewerId={viewer.id}
        alreadyJoined={match.participants.some((p) => p.id === viewer.id)}
        full={match.joined >= match.capacity}
      />
    </main>
  );
}
