import { notFound } from "next/navigation";
import { SosCall } from "@/components/SosCall";
import { getMatch, listMatches } from "@/lib/matches";
import { CURRENT_PLAYER_ID } from "@/lib/session";

export default async function SosPage({ searchParams }: { searchParams: Promise<{ mac?: string }> }) {
  const { mac } = await searchParams;
  const match = mac ? await getMatch(mac) : (await listMatches(CURRENT_PLAYER_ID))[0];
  if (!match) notFound();

  return <SosCall matchId={match.id} matchTitle={match.title} sport={match.sport} />;
}
