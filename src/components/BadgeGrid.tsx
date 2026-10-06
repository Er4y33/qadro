"use client";

import { useState } from "react";
import {
  ClipboardList,
  Compass,
  Flag,
  Handshake,
  LifeBuoy,
  Lock,
  Shapes,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { BadgeIcon, BadgeProgress } from "@/lib/badges";
import { ProgressBar, cn } from "./ui";

const ICONS: Record<BadgeIcon, LucideIcon> = {
  Flag,
  ShieldCheck,
  LifeBuoy,
  Handshake,
  ClipboardList,
  Compass,
  Shapes,
  Trophy,
};

/** Profildeki rozet ızgarası. Bir rozete dokununca koşulu ve ilerlemesi görünür. */
export function BadgeGrid({ badges }: { badges: BadgeProgress[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = badges.find((b) => b.id === selectedId);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="mb-3 text-xs text-muted">
        {earnedCount} / {badges.length} rozet kazanıldı
      </p>

      <ul className="grid grid-cols-4 gap-3">
        {badges.map((b) => {
          const Icon = ICONS[b.icon];
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setSelectedId(b.id === selectedId ? null : b.id)}
                aria-pressed={b.id === selectedId}
                aria-label={`${b.name}${b.earned ? "" : " (kilitli)"}`}
                className="flex w-full flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition",
                    b.earned ? "border-warning bg-warning/15 text-warning" : "border-line bg-surface-2 text-muted",
                    b.id === selectedId && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                  )}
                >
                  <Icon size={22} />
                  {!b.earned && (
                    <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 ring-2 ring-surface">
                      <Lock size={11} />
                    </span>
                  )}
                </span>
                <span className={cn("text-center text-[10px] leading-tight font-semibold", !b.earned && "text-muted")}>
                  {b.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <div className="mt-4 rounded-xl bg-surface-2 p-3" aria-live="polite">
          <p className="text-sm font-bold">{selected.name}</p>
          <p className="mt-0.5 text-xs text-muted">{selected.description}</p>
          <div className="mt-3 mb-1 flex justify-between text-[11px] font-semibold">
            <span>{selected.earned ? "Kazanıldı" : "İlerleme"}</span>
            <span>
              {selected.current} / {selected.target}
            </span>
          </div>
          <ProgressBar value={selected.current} max={selected.target} tone={selected.earned ? "warning" : "primary"} />
        </div>
      )}
    </div>
  );
}
