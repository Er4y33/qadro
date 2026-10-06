import { notFound } from "next/navigation";
import { SosCall } from "@/components/SosCall";
import { getMatch, matches } from "@/lib/mock-data";

export default async function SosPage({ searchParams }: { searchParams: Promise<{ mac?: string }> }) {
  const { mac } = await searchParams;
  const match = mac ? getMatch(mac) : matches[0];
  if (!match) notFound();

  return <SosCall matchId={match.id} matchTitle={match.title} />;
}
