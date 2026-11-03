import Link from "next/link";
import { AlertTriangle, Crown, Hourglass } from "lucide-react";
import { ScreenHeader, cn } from "@/components/ui";
import { getMatchHistory, groupByMonth, type HistoryEntry } from "@/lib/history";
import { isSport, SPORT_EMOJI } from "@/lib/sports";
import { requireViewer } from "@/lib/session";
import { SPORT_LABELS, type Sport } from "@/lib/types";

/** SSR: geçmiş, takım arkadaşlarının oylarından her açılışta yeniden hesaplanır */
export const dynamic = "force-dynamic";

const TZ = "Europe/Istanbul";
const dayFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, weekday: "short" });

export default async function MatchHistoryPage({ searchParams }: { searchParams: Promise<{ brans?: string }> }) {
  const viewer = await requireViewer();
  const { brans } = await searchParams;
  const sport = isSport(brans) ? brans : undefined;
  const history = await getMatchHistory(viewer.id, sport);
  const groups = groupByMonth(history.entries, TZ);

  return (
    <div className="lg:mx-auto lg:max-w-2xl" data-sport={sport}>
      <ScreenHeader title="Maç Geçmişi" backHref="/profil" />

      <div className="px-5">
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Branş">
          <FilterChip href="/profil/gecmis" active={!sport}>
            Tümü
          </FilterChip>
          {(Object.keys(SPORT_LABELS) as Sport[]).map((s) => (
            <FilterChip key={s} href={`/profil/gecmis?brans=${s}`} active={sport === s} sport={s}>
              {SPORT_EMOJI[s]} {SPORT_LABELS[s]}
            </FilterChip>
          ))}
        </nav>

        <section className="mt-4 grid grid-cols-2 divide-x divide-line rounded-2xl border border-line bg-surface py-4 text-center">
          <div>
            <p className="text-xs font-semibold text-muted">Toplam Maç</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{history.total}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Kazanılan Övgü</p>
            <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{history.praisesReceived}</p>
          </div>
        </section>

        {groups.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {sport ? `Henüz ${SPORT_LABELS[sport].toLocaleLowerCase("tr")} maçı oynamadın.` : "Henüz oynanmış maçın yok."}{" "}
            <Link href="/" className="font-semibold text-primary">
              Maç bul →
            </Link>
          </p>
        )}

        {groups.map((g) => (
          <section key={g.month} className="mt-6">
            <h2 className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">{g.month.toLocaleUpperCase("tr")}</h2>
            <ul className="space-y-3">
              {g.entries.map((e) => (
                <HistoryCard key={e.matchId} entry={e} />
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-6 text-xs text-muted">
          Durum, takım arkadaşlarının maç sonu oylarından belirlenir: en az 3 oy ve çoğunluk &quot;Geldi&quot; derse maç
          oynanmış sayılır ve XP verilir. Çoğunluk &quot;Gelmedi&quot; derse güvenilirlik puanın düşer.
        </p>
      </div>
    </div>
  );
}

function FilterChip({ href, active, sport, children }: { href: string; active: boolean; sport?: Sport; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      data-sport={sport}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold",
        active ? "border-primary bg-primary/15 text-primary" : "border-line bg-surface text-muted",
      )}
    >
      {children}
    </Link>
  );
}

const STATUS: Record<HistoryEntry["outcome"], { label: string; className: string }> = {
  confirmed: { label: "Oynandı", className: "text-primary" },
  no_show: { label: "Gidilmedi", className: "text-danger" },
  pending: { label: "Onay Bekliyor", className: "text-muted" },
};

function HistoryCard({ entry: e }: { entry: HistoryEntry }) {
  const date = new Date(e.startsAt);
  const missed = e.outcome === "no_show";
  const status = STATUS[e.outcome];

  return (
    <li data-sport={e.sport}>
      <Link
        href={`/mac/${e.matchId}`}
        className={cn("flex gap-3 rounded-2xl border border-line bg-surface p-3", missed && "opacity-70")}
      >
        <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-bg leading-tight">
          <span className="text-xs text-muted">{dayFmt.format(date)}</span>
          <span className={cn("text-sm font-bold capitalize", missed && "text-muted")}>{weekdayFmt.format(date).replace(".", "")}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className={cn("truncate font-semibold", missed && "text-muted")}>
              {SPORT_EMOJI[e.sport]} {e.title}
            </span>
            <span className={cn("shrink-0 text-xs font-bold", status.className)}>{status.label}</span>
          </span>
          <span className="block text-xs text-muted">
            {e.venueShort} • {e.format}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {missed && (
              <Tag className="bg-danger/15 text-danger">
                <AlertTriangle size={11} /> Katılmadın (Puan Düştü)
              </Tag>
            )}
            {e.outcome === "pending" && (
              <Tag className="bg-surface-2 text-muted">
                <Hourglass size={11} /> Oylar bekleniyor
              </Tag>
            )}
            {e.mvp && (
              <Tag className="bg-warning/15 text-warning">
                <Crown size={11} /> Maçın Oyuncusu
              </Tag>
            )}
            {e.organizer && <Tag className="bg-violet/15 text-violet">📣 Organizatördün</Tag>}
            {e.praises.map((p) => (
              <Tag key={p.id} className="bg-primary/10 text-primary">
                {p.emoji} {p.label}
                {p.count > 1 && ` ×${p.count}`}
              </Tag>
            ))}
          </span>
        </span>
      </Link>
    </li>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", className)}>{children}</span>;
}
