import { notFound } from "next/navigation";
import { TeamReview } from "@/components/TeamReview";
import { requireViewer } from "@/lib/session";
import { getProfile } from "@/lib/players";
import { getMatch } from "@/lib/matches";

export default async function TeamReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(await requireViewer());
  const match = await getMatch(id);
  if (!match) notFound();

  // Oyuncu kendini değerlendirmez
  const teammates = match.lineup.filter((slot) => slot.player.id !== profile.id);

  return <TeamReview matchId={match.id} teammates={teammates} ratingsGivenBefore={profile.stats.ratingsGiven} />;
}
