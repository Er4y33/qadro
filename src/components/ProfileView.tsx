import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  CalendarRange,
  ChevronRight,
  CircleCheck,
  Flame,
  Hourglass,
  Settings,
  Star,
  Trophy,
} from "lucide-react";
import { Avatar, SectionTitle } from "./ui";
import { SportSkills } from "./SportSkills";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";
import { BadgeGrid } from "./BadgeGrid";
import { BackButton } from "./BackButton";
import { ShareButton } from "./ShareButton";
import { evaluateBadges } from "@/lib/badges";
import { levelFromXp, reliabilityTier, XP_REWARDS } from "@/lib/gamification";
import type { Profile } from "@/lib/players";

const dateFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short" });

/**
 * Oyuncu profili görünümü. İki yerde kullanılır:
 * - /profil (own = true): kendi profilin; ayarlar, değerlendirme düğmeleri, panel ve çıkış görünür.
 * - /oyuncu/[id] (own = false): herkese açık profil ("Qadro Profilin"); paylaşılabilir, kişisel düğmeler yok.
 */
export function ProfileView({ profile, own }: { profile: Profile; own: boolean }) {
  const { level, current, needed } = levelFromXp(profile.totalXp);
  const badges = evaluateBadges(profile.stats);
  const earned = badges.filter((b) => b.earned);

  return (
    <div className="relative overflow-hidden px-5 pt-6 lg:mx-auto lg:max-w-6xl lg:overflow-visible lg:px-10 lg:pt-10">
      {/* Figma'daki büyük arka plan dairesi */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 lg:hidden" />

      <header className="relative grid grid-cols-[40px_1fr_40px] items-center lg:grid-cols-[40px_1fr_40px]">
        {own ? (
          <Link href="/ayarlar" aria-label="Ayarlar" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
            <Settings size={18} />
          </Link>
        ) : (
          <BackButton />
        )}
        <h1 className="text-center text-lg font-bold lg:text-3xl">{own ? "Profil" : "Oyuncu Profili"}</h1>
        {own ? <ThemeToggle /> : <span />}
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
            {own && profile.pendingMatches > 0 && (
              <p
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11px] text-muted"
                title="Maç XP'si, takım arkadaşlarının en az 3 oyuyla maça geldiğin onaylanınca eklenir."
              >
                <Hourglass size={12} /> {profile.pendingMatches} maçın onay bekliyor (+
                {(profile.pendingMatches * XP_REWARDS.matchAttended).toLocaleString("tr-TR")} XP)
              </p>
            )}
          </section>

          <section className="relative mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat value={profile.stats.matchesPlayed} label="Oynanan Maç" />
            <div className="rounded-2xl border border-line bg-surface px-2 py-3">
              <p
                className="mx-auto flex w-fit items-center gap-1 rounded-lg bg-gradient-to-r from-[#ffd54f] to-[#ff8a00] px-3 py-0.5 text-lg font-bold text-[#121419] tabular-nums"
                title="Takım arkadaşlarının Geldi/Gelmedi oylarından hesaplanan güvenilirlik puanı (0–5)"
              >
                {profile.reliability.toFixed(1)} <Star size={13} fill="currentColor" />
              </p>
              <p className="mt-1 text-[11px] font-bold tracking-wide text-warning uppercase">{reliabilityTier(profile.reliability).label.toLocaleUpperCase("tr")}</p>
            </div>
            <Stat value={profile.mvpAwards} label="MVP Ödülü" />
          </section>

          <section className="relative mt-3 grid grid-cols-2 gap-3" aria-label="Seri ve sezon">
            <div className="rounded-2xl border border-line bg-surface p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                <Flame size={13} className="text-warning" /> Seri
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {profile.streak.current} <span className="text-sm font-semibold text-muted">hafta</span>
              </p>
              <p className="text-[11px] text-muted">
                {profile.streak.playedThisWeek ? "Bu hafta oynadın" : "Bu hafta henüz maç yok"} · En iyi {profile.streak.best}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                <CalendarRange size={13} className="text-primary" /> Sezon
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {profile.season.xp.toLocaleString("tr-TR")} <span className="text-sm font-semibold text-muted">XP</span>
              </p>
              <p className="text-[11px] text-muted">
                {profile.season.rank ? `${profile.season.rank}. sıra / ${profile.season.players}` : "Henüz sıralamada değilsin"} ·{" "}
                {profile.season.daysLeft} gün kaldı
              </p>
            </div>
            <p className="col-span-2 -mt-1 text-[11px] text-muted">{profile.season.name}: sezon XP&apos;si her sezon sıfırdan başlar.</p>
          </section>

          <div className="relative mt-3">
            <ShareButton
              title={`${profile.name} · Qadro`}
              text={`${profile.name} Qadro'da: Seviye ${level}, ${profile.stats.matchesPlayed} onaylı maç, ${profile.reliability.toFixed(1)} güvenilirlik${earned.length ? `, ${earned.length} başarım (${earned.map((b) => b.name).join(", ")})` : ""}.`}
              path={`/oyuncu/${profile.id}`}
              label={own ? "Başarını Paylaş" : "Profili Paylaş"}
            />
          </div>

          <Link
            href="/siralama"
            className="relative mt-3 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3"
          >
            <Trophy size={20} className="text-primary" />
            <span className="flex-1 text-sm font-semibold">Şehrin En İyileri</span>
            <span className="text-xs text-muted">Sıralamanı gör</span>
            <ChevronRight size={16} className="text-muted" />
          </Link>

          {own && (
            <Link
              href="/panel"
              className="relative mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
            >
              <BarChart3 size={20} className="text-primary" />
              <span className="flex-1 text-sm font-semibold">Kullanıcı Davranışı Paneli</span>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          )}
        </div>

        <div>
          <SportSkills skills={profile.skills} initial={profile.primarySport} />

          <section className="mt-6">
            <SectionTitle>Başarımlar</SectionTitle>
            <BadgeGrid badges={badges} />
          </section>

          <section className="mt-6">
            <SectionTitle
              action={
                own ? (
                  <Link href="/profil/gecmis" className="text-sm font-semibold text-primary">
                    Tümünü Gör
                  </Link>
                ) : undefined
              }
            >
              Son Maçlar
            </SectionTitle>
            {profile.recentMatches.length > 0 ? (
              <ul className="space-y-2">
                {profile.recentMatches.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                      <CalendarCheck size={20} />
                    </span>
                    <Link href={`/mac/${m.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.title}</p>
                      <p className="text-xs text-muted">
                        {dateFmt.format(new Date(m.startsAt))} • {m.format} • {m.venueShort}
                      </p>
                    </Link>
                    {own &&
                      (m.reviewed ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted">
                          <CircleCheck size={14} /> Değerlendirildi
                        </span>
                      ) : (
                        <Link
                          href={`/mac/${m.id}/degerlendir`}
                          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
                        >
                          Değerlendir
                        </Link>
                      ))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
                Henüz oynanmış maç yok.{" "}
                {own && (
                  <Link href="/" className="font-semibold text-primary">
                    İlk maçını bul →
                  </Link>
                )}
              </p>
            )}
          </section>

          {own && (
            <div className="mt-8 mb-4">
              <LogoutButton />
            </div>
          )}
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
