import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui";
import { MatchFeed } from "@/components/MatchFeed";
import { listMatches } from "@/lib/matches";
import { requireViewer } from "@/lib/session";

// Maçlar veritabanından her istekte okunur (SSR); filtreleme tarayıcıda (CSR).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await requireViewer();
  const matches = await listMatches(viewer.id);
  return (
    <div className="px-5 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/profil" className="flex items-center gap-3">
          <Avatar player={viewer} size={42} />
          <div className="leading-tight">
            <p className="text-xs text-muted">Selam,</p>
            <p className="text-lg font-bold">{viewer.name.split(" ")[0]}!</p>
          </div>
        </Link>
        <Link
          href="/bildirimler"
          aria-label="Bildirimler (3 yeni)"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger" />
        </Link>
      </header>

      <MatchFeed matches={matches} />
    </div>
  );
}
