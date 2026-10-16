import Link from "next/link";
import { BarChart3, CalendarCheck, ChevronRight, CircleCheck, Star, Trophy } from "lucide-react";
import { Avatar, SectionTitle } from "@/components/ui";
import { RadarChart } from "@/components/RadarChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { requireViewer } from "@/lib/session";
import { getProfile } from "@/lib/players";
import { levelFromXp } from "@/lib/gamification";
import { evaluateBadges } from "@/lib/badges";
import { BadgeGrid } from "@/components/BadgeGrid";

export default async function ProfilePage() {
  const profile = await getProfile(await requireViewer());
  const { level, current, needed } = levelFromXp(profile.totalXp);
  const lastMatch = profile.recentMatch;
  const badges = evaluateBadges(profile.stats);

  return (
    <div className="relative overflow-hidden px-5 pt-6 lg:mx-auto lg:max-w-6xl lg:overflow-visible lg:px-10 lg:pt-10">
      {/* Figma'daki büyük arka plan dairesi */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 lg:hidden" />

      <header className="relative grid grid-cols-[40px_1fr_40px] items-center lg:grid-cols-[1fr_40px]">
        <span className="lg:hidden" />
        <h1 className="text-center text-lg font-bold lg:text-left lg:text-3xl">Profil</h1>
        <ThemeToggle />
      </header>

      {/* Masaüstünde iki kolon: solda sabit oyuncu kartı, sağda övgüler, başarımlar ve maçlar */}
      <div className="lg:mt-6 lg:grid lg:grid-cols-[340px_1fr] lg:gap-10">
        <div className="lg:sticky lg:top-10 lg:self-start lg:rounded-3xl lg:border lg:border-line lg:bg-surface/60 lg:p-6">
          <section className="relative mt-5 flex flex-col items-center text-center lg:mt-0">
            <span className="rounded-full border-2 border-primary p-1">
              <Avatar player={profile} size={76} badge={level} className="border-4 border-bg" />
            </span>
            <h2 className="mt-3 text-2xl font-bold">{profile.name}</h2>
            <p className="text-sm font-semibold text-success">
              {profile.role} • {profile.city}
            </p>
            <p className="mt-1 text-xs text-muted">
              Seviye {level} • {current.toLocaleString("tr-TR")} / {needed.toLocaleString("tr-TR")} XP
            </p>
          </section>

          <section className="relative mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat value={profile.stats.matchesPlayed} label="Oynanan Maç" />
            <Stat
              value={
                <span className="inline-flex items-center gap-1 text-warning">
                  {profile.reliability.toFixed(1)} <Star size={13} fill="currentColor" />
                </span>
              }
              label="Güvenilirlik"
            />
            <Stat value={profile.mvpAwards} label="MVP Ödülü" />
          </section>

          <Link
            href="/siralama"
            className="relative mt-3 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3"
          >
            <Trophy size={20} className="text-primary" />
            <span className="flex-1 text-sm font-semibold">Şehrin En İyileri</span>
            <span className="text-xs text-muted">Sıralamanı gör</span>
            <ChevronRight size={16} className="text-muted" />
          </Link>

          <Link
            href="/panel"
            className="relative mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <BarChart3 size={20} className="text-primary" />
            <span className="flex-1 text-sm font-semibold">Kullanıcı Davranışı Paneli</span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        </div>

        <div>
          <section className="mt-6 lg:mt-0">
            <SectionTitle>Övgüler</SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {profile.praises.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl border border-line bg-surface py-3 text-center ${p.count === 0 ? "opacity-40" : ""}`}
                  title={`${p.label}: ${p.count} kez`}
                >
                  <p className="text-xl">{p.emoji}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{p.count}</p>
                  <p className="text-[10px] text-muted">{p.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Maç sonunda takım arkadaşların veriyor. XP kazandırmaz, itibarını gösterir.</p>
          </section>

          <section className="mt-6">
            <SectionTitle>Başarımlar</SectionTitle>
            <BadgeGrid badges={badges} />
          </section>

          <section className="mt-6">
            <SectionTitle>Oyuncu Özellikleri</SectionTitle>
            <div className="rounded-2xl border border-line bg-surface p-2">
              {profile.attributes ? (
                <RadarChart data={profile.attributes} />
              ) : (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  Maçlardan sonra takım arkadaşların seni değerlendirdikçe özellik grafiğin burada oluşacak.
                </p>
              )}
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
            {lastMatch ? (
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 text-success">
                  <CalendarCheck size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{lastMatch.title}</p>
                  <p className="text-xs text-muted">
                    {lastMatch.format} • {lastMatch.venueShort}
                  </p>
                </div>
                {lastMatch.reviewed ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                    <CircleCheck size={14} /> Değerlendirildi
                  </span>
                ) : (
                  <Link
                    href={`/mac/${lastMatch.id}/degerlendir`}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
                  >
                    Değerlendir
                  </Link>
                )}
              </div>
            ) : (
              <Link href="/" className="block rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
                Henüz oynanmış maçın yok. <span className="font-semibold text-primary">İlk maçını bul →</span>
              </Link>
            )}
          </section>

          <div className="mt-8 mb-4">
            <LogoutButton />
          </div>
        </div>
      </div>
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
