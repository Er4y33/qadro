"use client";

import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import { Avatar, cn } from "./ui";

interface Data {
  season: { name: string; daysLeft: number };
  entries: { playerId: string; name: string; initials: string; color: string; xp: number; rank: number }[];
}

/**
 * Sezon sıralaması: her üç ayda bir sıfırlanır. Yeni oyuncu da üst sıralara çıkabilir (Akış: ulaşılabilir hedef).
 * Veri istemcide /api/season'dan okunur; böylece S.O.S ya da değerlendirme sonrası değişim hemen görünür.
 */
export function SeasonStandings({ playerId: fallbackId }: { playerId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [playerId, setPlayerId] = useState(fallbackId);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me: { id?: string } | null) => me?.id && setPlayerId(me.id))
      .catch(() => {});
    fetch("/api/season", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className="mx-5 mt-8 rounded-2xl border border-line bg-surface p-4" aria-label="Sezon sıralaması">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <CalendarRange size={18} className="text-primary" /> {data?.season.name ?? "Bu Sezon"}
        </h2>
        {data && <span className="text-xs text-muted">{data.season.daysLeft} gün kaldı</span>}
      </div>
      <p className="mt-1 text-xs text-muted">
        Onaylanan maçlar, değerlendirmeler, S.O.S yanıtları ve MVP ödüllerinden gelen sezon XP&apos;si. Her sezon sıfırdan başlar.
      </p>
      {failed && <p className="mt-4 text-sm text-muted">Sezon sıralaması şu an yüklenemedi.</p>}
      {!data && !failed && <p className="mt-4 text-sm text-muted">Yükleniyor…</p>}
      {data && data.entries.length === 0 && <p className="mt-4 text-sm text-muted">Bu sezon henüz XP kazanan yok.</p>}
      {data && data.entries.length > 0 && (
        <ol className="mt-3 divide-y divide-line">
          {data.entries.map((e) => (
            <li key={e.playerId} className={cn("flex items-center gap-3 py-2", e.playerId === playerId && "font-bold text-primary")}>
              <span className="w-6 text-right text-sm tabular-nums text-muted">{e.rank}</span>
              <Avatar player={e} size={30} />
              <span className="min-w-0 flex-1 truncate text-sm">{e.playerId === playerId ? `${e.name} (sen)` : e.name}</span>
              <span className="text-sm font-semibold tabular-nums">{e.xp.toLocaleString("tr-TR")} XP</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
