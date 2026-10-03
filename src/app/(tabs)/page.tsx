import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui";
import { MatchFeed } from "@/components/MatchFeed";
import { currentUser, matches } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="px-5 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/profil" className="flex items-center gap-3">
          <Avatar player={currentUser} size={42} />
          <div className="leading-tight">
            <p className="text-xs text-muted">Selam,</p>
            <p className="text-lg font-bold">{currentUser.name}!</p>
          </div>
        </Link>
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger" />
        </button>
      </header>

      <MatchFeed matches={matches} />
    </div>
  );
}
