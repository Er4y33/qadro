"use client";

import { useEffect, useState } from "react";
import type { SportSkill } from "@/lib/players";
import { SPORT_EMOJI } from "@/lib/sports";
import { SPORT_LABELS } from "@/lib/types";
import { RadarChart } from "./RadarChart";
import { SectionTitle, cn } from "./ui";

/**
 * Profildeki branş sekmeleri: her branşın kendi övgüleri ve radar eksenleri vardır
 * (6 eksenli altıgen: ör. tenis Servis, Forehand, Backhand, Vole, Hız, Kondisyon).
 * Ekip kararı ("Active Context"): seçilen sekme bütün profil ekranının rengini değiştirir
 * (voleybol sekmesi → profil mor). Profilden çıkınca önceki tema geri gelir.
 */
export function SportSkills({ skills, initial }: { skills: SportSkill[]; initial: SportSkill["sport"] }) {
  const [sport, setSport] = useState(initial);
  const skill = skills.find((s) => s.sport === sport) ?? skills[0];

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.sport;
    root.dataset.sport = sport;
    return () => {
      if (previous) root.dataset.sport = previous;
      else delete root.dataset.sport;
    };
  }, [sport]);

  return (
    <div>
      <div className="mt-6 flex gap-2 overflow-x-auto lg:mt-0" role="tablist" aria-label="Branş">
        {skills.map((s) => (
          <button
            key={s.sport}
            type="button"
            role="tab"
            aria-selected={s.sport === sport}
            onClick={() => setSport(s.sport)}
            data-sport={s.sport}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
              s.sport === sport ? "border-primary bg-primary/15 text-primary" : "border-line bg-surface text-muted",
            )}
          >
            {SPORT_EMOJI[s.sport]} {SPORT_LABELS[s.sport]}
          </button>
        ))}
      </div>

      <section className="mt-4">
        <SectionTitle>Övgüler</SectionTitle>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {skill.praises.map((p) => (
            <div
              key={p.id}
              className={cn("rounded-2xl border border-line bg-surface px-1 py-3 text-center", p.count === 0 && "opacity-40")}
              title={`${p.label}: ${p.count} kez`}
            >
              <p className="text-xl">{p.emoji}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{p.count}</p>
              <p className="text-[10px] leading-tight text-muted">{p.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Maç sonunda takım arkadaşların veriyor. XP kazandırmaz, itibarını gösterir.</p>
      </section>

      <section className="mt-6">
        <SectionTitle>Oyuncu Özellikleri</SectionTitle>
        <div className="rounded-2xl border border-line bg-surface p-2">
          {skill.attributes ? (
            <RadarChart data={skill.attributes} />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted">
              {SPORT_LABELS[sport]} maçlarından sonra takım arkadaşların değerlendirdikçe özellik grafiği burada oluşacak.
            </p>
          )}
        </div>
        {skill.attributes && (
          <p className="mt-2 text-xs text-muted">
            Her eksen bir beceri övgüsüdür ve {SPORT_LABELS[sport].toLocaleLowerCase("tr")} maçlarında takım arkadaşlarından
            gelir. En çok övgü aldığın beceri en dışta, diğerleri ona oranla çizilir. Kendini puanlayamazsın.
          </p>
        )}
      </section>
    </div>
  );
}
