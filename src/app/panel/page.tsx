import type { Metadata } from "next";
import { Activity, CalendarCheck, Percent, Users } from "lucide-react";
import { ScreenHeader, SectionTitle } from "@/components/ui";
import { getDashboard } from "@/lib/dashboard";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Kullanıcı Davranışı Paneli | Qadro" };

/*
 * Dashboard: kullanıcıların uygulamada ne yaptığını user_events tablosundan gösterir.
 * SSR: her açılışta veritabanından güncel hesaplanır.
 * Grafikler kütüphanesiz, sade HTML/CSS ile çizilir (tek renk = tek seri; değerler metin olarak da yazılır).
 */
export const dynamic = "force-dynamic";

const TZ = "Europe/Istanbul";
const dayFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DashboardPage() {
  await requireViewer();
  const data = await getDashboard();
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.events));
  const totalEvents = data.byType.reduce((sum, t) => sum + t.count, 0);

  return (
    <main className="flex-1 pb-12 lg:mx-auto lg:w-full lg:max-w-6xl lg:px-6">
      <ScreenHeader title="Kullanıcı Davranışı" backHref="/profil" />

      <div className="space-y-7 px-5">
        <p className="text-sm text-muted">
          Uygulamadaki her kayıt, giriş, maç oluşturma ve katılma <code className="text-fg">user_events</code> tablosuna yazılır.
          Bu panel o kayıtlardan hesaplanır.
        </p>

        {/* KPI satırı: tek bir sayı anlatıyorsa grafik değil, sayının kendisi */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Özet">
          <Kpi icon={Users} value={data.kpis.registered} label="Kayıtlı kullanıcı" />
          <Kpi icon={Activity} value={data.kpis.active7d} label="Son 7 günde aktif" />
          <Kpi icon={CalendarCheck} value={data.kpis.openMatches} label="Yaklaşan maç" />
          <Kpi icon={Percent} value={`%${data.kpis.avgFill}`} label="Ortalama doluluk" />
        </section>

        <section>
          <SectionTitle>Günlük Etkinlik (son 14 gün)</SectionTitle>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="relative flex h-36 items-end gap-0.5 lg:h-56 lg:gap-1" role="list" aria-label="Günlük olay sayısı">
              {/* Sade yatay kılavuz çizgileri */}
              <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
              {data.daily.map((d) => {
                const label = dayFmt.format(new Date(`${d.day}T00:00:00Z`));
                return (
                  <div
                    key={d.day}
                    role="listitem"
                    aria-label={`${label}: ${d.events} olay, ${d.users} kullanıcı`}
                    className="group relative flex h-full flex-1 items-end"
                  >
                    <div
                      className="w-full rounded-t bg-primary transition group-hover:opacity-80"
                      style={{ height: d.events ? `${Math.max(4, (d.events / maxDaily) * 100)}%` : 0 }}
                    />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg border border-line bg-bg px-2 py-1 text-[11px] whitespace-nowrap shadow-lg group-hover:block">
                      <strong>{label}</strong> · {d.events} olay · {d.users} kişi
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted">
              <span>{dayFmt.format(new Date(`${data.daily[0].day}T00:00:00Z`))}</span>
              <span>en yüksek: {maxDaily} olay</span>
              <span>Bugün</span>
            </div>
          </div>
        </section>

        {/* Masaüstünde üç dağılım grafiği yan yana */}
        <div className="space-y-7 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          <section>
            <SectionTitle>Dönüşüm Hunisi</SectionTitle>
            <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              {data.funnel.map((step) => (
                <Bar
                  key={step.label}
                  label={step.label}
                  value={step.count}
                  max={data.funnel[0].count}
                  note={data.funnel[0].count ? `%${Math.round((step.count / data.funnel[0].count) * 100)}` : "–"}
                />
              ))}
              <p className="pt-1 text-xs text-muted">Kayıt olanların ne kadarının gerçekten oyuna dahil olduğunu gösterir.</p>
            </div>
          </section>

          <section>
            <SectionTitle>Olay Türleri</SectionTitle>
            <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              {data.byType.length === 0 && <p className="text-sm text-muted">Henüz olay yok.</p>}
              {data.byType.map((t) => (
                <Bar
                  key={t.type}
                  label={t.label}
                  value={t.count}
                  max={data.byType[0].count}
                  note={`%${Math.round((t.count / totalEvents) * 100)}`}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Branşlar</SectionTitle>
            <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              {data.bySport.map((s) => (
                <Bar
                  key={s.sport}
                  label={s.label}
                  value={s.matches}
                  max={data.bySport[0].matches}
                  note={`doluluk %${s.avgFill}`}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-7 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
          <section>
            <SectionTitle>Son Hareketler</SectionTitle>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {data.recent.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <strong>{e.player}</strong> <span className="text-muted">· {e.label}</span>
                    {e.match && <span className="block truncate text-xs text-muted">{e.match}</span>}
                  </span>
                  <time dateTime={e.at} className="shrink-0 text-xs text-muted">
                    {timeFmt.format(new Date(e.at))}
                  </time>
                </li>
              ))}
              {data.recent.length === 0 && <li className="px-4 py-3 text-sm text-muted">Henüz hareket yok.</li>}
            </ul>
          </section>

          <details className="rounded-2xl border border-line bg-surface p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Günlük veriyi tablo olarak gör</summary>
            <table className="mt-3 w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 font-medium">Gün</th>
                  <th className="py-1 text-right font-medium">Olay</th>
                  <th className="py-1 text-right font-medium">Kullanıcı</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.map((d) => (
                  <tr key={d.day} className="border-t border-line">
                    <td className="py-1">{dayFmt.format(new Date(`${d.day}T00:00:00Z`))}</td>
                    <td className="py-1 text-right tabular-nums">{d.events}</td>
                    <td className="py-1 text-right tabular-nums">{d.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </div>
    </main>
  );
}

function Kpi({ icon: Icon, value, label }: { icon: typeof Users; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <Icon size={18} className="text-muted" />
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

/** Yatay çubuk: tek seri olduğu için tek renk; değer ve oran metin olarak da yazılır */
function Bar({ label, value, max, note }: { label: string; value: number; max: number; note: string }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div title={`${label}: ${value}`}>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">
          <strong>{value}</strong> <span className="text-xs text-muted">{note}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value ? Math.max(2, pct) : 0}%` }} />
      </div>
    </div>
  );
}
