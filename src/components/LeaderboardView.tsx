"use client";

import { useState } from "react";
import { ChevronDown, Crown, Flame, MapPin } from "lucide-react";
import {
  DISTRICT,
  METRIC_LABELS,
  leaderboard,
  nextGoal,
  rankBy,
  type LeaderboardMetric,
  type RankedEntry,
} from "@/lib/leaderboard";
import { Avatar, cn } from "./ui";

const formatValue = (metric: LeaderboardMetric, v: number) =>
  metric === "rating" ? v.toFixed(2).replace(/0$/, "") : String(v);

export function LeaderboardView({ playerId }: { playerId: string }) {
  const [metric, setMetric] = useState<LeaderboardMetric>("rating");
  const ranked = rankBy(leaderboard, metric);
  const [first, second, third] = ranked;
  const rest = ranked.slice(3, 6);
  const me = ranked.find((e) => e.id === playerId);
  const goal = nextGoal(ranked, playerId);

  return (
    <div className="px-5 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Şehrin En İyileri</h1>
        <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-primary">
          <MapPin size={12} /> {DISTRICT} <ChevronDown size={14} className="text-muted" />
        </span>
      </header>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="Sıralama ölçütü">
        {(Object.keys(METRIC_LABELS) as LeaderboardMetric[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={metric === m}
            onClick={() => setMetric(m)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
              metric === m ? "border-primary bg-primary text-on-primary" : "border-line bg-surface",
            )}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Podyum: 2 – 1 – 3 */}
      <section className="mt-8 grid grid-cols-3 items-end gap-2 text-center">
        <PodiumSpot entry={second} metric={metric} size={56} ring="ring-slate-400" />
        <PodiumSpot entry={first} metric={metric} size={80} ring="ring-warning" crown />
        <PodiumSpot entry={third} metric={metric} size={56} ring="ring-info" />
      </section>

      <ol className="mt-6 space-y-2">
        {rest.map((e) => (
          <Row key={e.id} entry={e} metric={metric} />
        ))}
      </ol>

      {me && me.rank > 6 && (
        <>
          <p className="my-2 text-center text-muted" aria-hidden>
            ⋮
          </p>
          <Row entry={me} metric={metric} highlight goal={goal} />
        </>
      )}
    </div>
  );
}

function PodiumSpot({
  entry,
  metric,
  size,
  ring,
  crown,
}: {
  entry: RankedEntry;
  metric: LeaderboardMetric;
  size: number;
  ring: string;
  crown?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center", crown && "-mt-6")}>
      {crown && <Crown size={22} className="mb-1 fill-warning text-warning" />}
      <span className="relative">
        <Avatar player={entry} size={size} className={cn("ring-4 ring-offset-2 ring-offset-bg", ring)} />
        <span className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-[10px] font-bold ring-2 ring-bg">
          {entry.rank}
        </span>
      </span>
      <p className={cn("mt-4 truncate font-semibold", crown ? "text-sm" : "text-xs")}>{entry.name}</p>
      <p className={cn("font-bold", crown ? "text-warning" : "text-xs text-primary")}>{formatValue(metric, entry.value)}</p>
    </div>
  );
}

function Row({
  entry,
  metric,
  highlight,
  goal,
}: {
  entry: RankedEntry;
  metric: LeaderboardMetric;
  highlight?: boolean;
  goal?: { target: string; gap: number } | null;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3",
        highlight ? "border-primary bg-primary/10" : "border-line bg-surface",
      )}
    >
      <span className={cn("w-5 text-sm font-bold", highlight ? "text-primary" : "text-muted")}>{entry.rank}</span>
      <Avatar player={entry} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {entry.name}
          {highlight && " (Sen)"}
        </p>
        {highlight && goal && (
          <p className="flex items-center gap-1 text-[11px] text-muted">
            {goal.gap > 0 ? (
              <>
                {goal.target} girmene {formatValue(metric, goal.gap)} {metric === "rating" ? "puan" : ""} kaldı
              </>
            ) : (
              <>{goal.target} girmek üzeresin, bir maç yeter</>
            )}
            <Flame size={11} className="text-warning" />
          </p>
        )}
      </div>
      <span className={cn("font-bold", highlight ? "text-primary" : "text-primary")}>{formatValue(metric, entry.value)}</span>
    </li>
  );
}
