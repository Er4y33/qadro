"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { SPORT_LABELS, type Match, type Sport } from "@/lib/types";
import { activeFilterCount, DATE_LABELS, DEFAULT_FILTERS, filterMatches, type DateFilter, type MatchFilters } from "@/lib/filters";
import { MatchCard } from "./MatchCard";
import { cn } from "./ui";

const STORAGE_KEY = "qadro-filters";
const PRICE_STEPS = [null, 0, 50, 100, 200] as const;

/**
 * Ana sayfadaki branş seçimi, "Filtreler" paneli ve "Sana Uygun Maçlar" listesi.
 * Maçlar sunucudan (SSR) gelir; filtreleme tarayıcıda yapılır (CSR), sayfa yeniden yüklenmez.
 * Seçilen filtreler bu tarayıcıda hatırlanır (localStorage; gizli sekmede kapalıysa varsayılanla devam edilir).
 */
export function MatchFeed({ matches, viewerLevel }: { matches: Match[]; viewerLevel: number }) {
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_FILTERS);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFilters({ ...DEFAULT_FILTERS, ...JSON.parse(saved) });
    } catch {
      /* localStorage kapalı */
    }
  }, []);

  const update = (patch: Partial<MatchFilters>) =>
    setFilters((f) => {
      const next = { ...f, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* localStorage kapalı */
      }
      return next;
    });

  // İlk çizimde (sunucu ile aynı olsun diye) yalnızca branş uygulanır; saat tarayıcıda belli olunca tarih filtresi de çalışır
  const visible = now ? filterMatches(matches, filters, { now, viewerLevel }) : matches.filter((m) => filters.sport === "all" || m.sport === filters.sport);
  const extra = activeFilterCount(filters);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Branş">
        {(["all", ...Object.keys(SPORT_LABELS)] as (Sport | "all")[]).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={filters.sport === s}
            onClick={() => update({ sport: s })}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              filters.sport === s ? "border-accent bg-accent text-on-primary" : "border-line bg-surface text-fg",
            )}
          >
            {s === "all" ? "Tümü" : SPORT_LABELS[s]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filters"
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
            extra ? "border-primary text-primary" : "border-line bg-surface",
          )}
        >
          <SlidersHorizontal size={15} /> Filtreler
          {extra > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">{extra}</span>}
        </button>
      </div>

      {open && (
        <section id="filters" aria-label="Filtreler" className="mt-3 space-y-4 rounded-2xl border border-line bg-surface p-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Tarih</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DATE_LABELS) as DateFilter[]).map((d) => (
                <Chip key={d} active={filters.date === d} onClick={() => update({ date: d })}>
                  {DATE_LABELS[d]}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Kişi başı ücret</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_STEPS.map((p) => (
                <Chip key={String(p)} active={filters.maxPrice === p} onClick={() => update({ maxPrice: p })}>
                  {p === null ? "Fark etmez" : p === 0 ? "Ücretsiz" : `₺${p} ve altı`}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <Toggle checked={filters.openOnly} onChange={(v) => update({ openOnly: v })}>
              Yalnızca boş yeri olan maçlar
            </Toggle>
            <Toggle checked={filters.myLevel} onChange={(v) => update({ myLevel: v })}>
              Seviyeme uygun maçlar (Seviye {viewerLevel})
            </Toggle>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => update({ ...DEFAULT_FILTERS, sport: filters.sport })} className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold">
              Temizle
            </button>
            <button type="button" onClick={() => setOpen(false)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary">
              <X size={14} /> {visible.length} maçı göster
            </button>
          </div>
        </section>
      )}

      <h2 className="mt-6 mb-3 text-lg font-bold">Sana Uygun Maçlar</h2>
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {visible.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted lg:col-span-2">
            {extra > 0 ? "Filtrelerine uyan maç yok. Filtreleri gevşetmeyi dene ya da " : "Bu branşta şu an açık maç yok. "}
            <Link href="/mac/olustur" className="font-semibold text-primary">
              ilk ilanı sen aç!
            </Link>
          </p>
        )}
      </div>
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", active ? "border-primary bg-primary/10 text-primary" : "border-line")}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>{children}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
    </label>
  );
}
