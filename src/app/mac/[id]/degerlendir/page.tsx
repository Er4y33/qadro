import { notFound } from "next/navigation";
import { TeamReview } from "@/components/TeamReview";
import { currentUser } from "@/lib/mock-data";
import { getMatch } from "@/lib/matches";

export default async function TeamReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  // Oyuncu kendini değerlendirmez
  const teammates = match.lineup.filter((slot) => slot.player.id !== currentUser.id);

  return <TeamReview matchId={match.id} teammates={teammates} ratingsGivenBefore={currentUser.stats.ratingsGiven} />;
}
