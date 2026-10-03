"use client";

import { useState } from "react";
import { SPORT_LABELS, type Match, type Sport } from "@/lib/types";
import { MatchCard } from "./MatchCard";
import { cn } from "./ui";

/** Ana sayfadaki spor filtresi ve "Sana Uygun Maçlar" listesi */
export function MatchFeed({ matches }: { matches: Match[] }) {
  const [sport, setSport] = useState<Sport>("futbol");
  const visible = matches.filter((m) => m.sport === sport);

  return (
    <>
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Branş">
        {(Object.keys(SPORT_LABELS) as Sport[]).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={sport === s}
            onClick={() => setSport(s)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              sport === s ? "border-accent bg-accent text-white" : "border-line bg-surface text-fg",
            )}
          >
            {SPORT_LABELS[s]}
          </button>
        ))}
      </div>

      <h2 className="mt-6 mb-3 text-lg font-bold">Sana Uygun Maçlar</h2>
      <div className="space-y-4">
        {visible.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Bu branşta şu an açık maç yok. İlk ilanı sen aç!
          </p>
        )}
      </div>
    </>
  );
}
