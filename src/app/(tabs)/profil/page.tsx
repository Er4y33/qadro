import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, SectionTitle } from "@/components/ui";
import { RadarChart } from "@/components/RadarChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { currentUser, matches } from "@/lib/mock-data";
import { levelFromXp } from "@/lib/gamification";
import { evaluateBadges } from "@/lib/badges";
import { BadgeGrid } from "@/components/BadgeGrid";

export default function ProfilePage() {
  const { level, current, needed } = levelFromXp(currentUser.totalXp);
  const lastMatch = matches[0];
  const badges = evaluateBadges(currentUser.stats);

  return (
    <div className="relative overflow-hidden px-5 pt-6">
      {/* Figma'daki büyük arka plan dairesi */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15" />

      <header className="relative grid grid-cols-[40px_1fr_40px] items-center">
        <span />
        <h1 className="text-center text-lg font-bold">Profil</h1>
        <ThemeToggle />
      </header>

      <section className="relative mt-5 flex flex-col items-center text-center">
        <span className="rounded-full border-2 border-primary p-1">
          <Avatar player={currentUser} size={76} badge={level} className="border-4 border-bg" />
        </span>
        <h2 className="mt-3 text-2xl font-bold">{currentUser.name}</h2>
        <p className="text-sm font-semibold text-success">
          {currentUser.role} • {currentUser.city}
        </p>
        <p className="mt-1 text-xs text-muted">
          Seviye {level} • {current.toLocaleString("tr-TR")} / {needed.toLocaleString("tr-TR")} XP
        </p>
      </section>

      <section className="relative mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat value={currentUser.matchesPlayed} label="Oynanan Maç" />
        <Stat
          value={
            <span className="inline-flex items-center gap-1 text-warning">
              {currentUser.rating} <Star size={13} fill="currentColor" />
            </span>
          }
          label="Güvenilirlik"
        />
        <Stat value={currentUser.mvpAwards} label="MVP Ödülü" />
      </section>

      <section className="mt-6">
        <SectionTitle>Rozetler</SectionTitle>
        <BadgeGrid badges={badges} />
      </section>

      <section className="mt-6">
        <SectionTitle>Oyuncu Özellikleri</SectionTitle>
        <div className="rounded-2xl border border-line bg-surface p-2">
          <RadarChart data={currentUser.attributes} />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle
          action={
            <Link href="/" className="text-sm font-semibold text-primary">
              Tümünü Gör
            </Link>
          }
        >
          Son Maçlar
        </SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 font-bold text-success">W</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{lastMatch.title}</p>
            <p className="text-xs text-muted">Dün • {lastMatch.format} • Merkez Saha</p>
          </div>
          <button type="button" className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            Değerlendir
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface py-3">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
