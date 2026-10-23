"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, UserMinus, X } from "lucide-react";
import type { PendingRequest } from "@/lib/requests";
import { POSITION_NAMES } from "@/lib/praise";
import { Avatar, SectionTitle } from "./ui";

interface RosterPlayer {
  id: string;
  name: string;
  initials: string;
  color: string;
  level: number;
  position: string | null;
  organizer: boolean;
}

const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} dk önce`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} sa önce`;
  return `${Math.round(minutes / 1440)} gün önce`;
};

/**
 * "İstekleri Yönet" ve "Onaylanan Kadro".
 * Organizatör her isteği oyuncunun takım arkadaşlarından aldığı güvenilirlikle birlikte görür (gelmediği maç sayısı dahil),
 * onaylar (PATCH …/requests/:playerId) ya da reddeder. Kadrodaki bir oyuncuyu çıkarabilir (DELETE …/participants?player=).
 */
export function RequestsManager({
  matchId,
  matchTitle,
  capacity,
  requiresApproval,
  requests,
  roster,
}: {
  matchId: string;
  matchTitle: string;
  capacity: number;
  requiresApproval: boolean;
  requests: PendingRequest[];
  roster: RosterPlayer[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const full = roster.length >= capacity;

  const act = (url: string, init: RequestInit) =>
    startTransition(async () => {
      setError(null);
      const res = await fetch(url, init);
      if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "İşlem başarısız.");
      router.refresh();
    });

  const decide = (playerId: string, decision: "approve" | "decline") =>
    act(`/api/matches/${matchId}/requests/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });

  return (
    <div className="space-y-6 px-5">
      <p className="text-sm text-muted">
        <span className="font-semibold text-fg">{matchTitle}</span> · {roster.length}/{capacity} oyuncu
      </p>
      {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-semibold text-danger">{error}</p>}

      {requiresApproval && (
        <section>
          <SectionTitle>Bekleyen İstekler ({requests.length})</SectionTitle>
          {requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">Şu an bekleyen istek yok.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.playerId} className="rounded-2xl border border-line bg-surface p-3">
                  <div className="flex items-center gap-3">
                    <Avatar player={r} size={44} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/oyuncu/${r.playerId}`} className="block truncate font-semibold hover:underline">
                        {r.name}
                      </Link>
                      <p className="text-xs text-muted">
                        Seviye {r.level}
                        {r.position && ` · ${POSITION_NAMES[r.position] ?? r.position}`} · {ago(r.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <span className="rounded-lg bg-surface-2 py-1.5">
                      <span className="inline-flex items-center gap-1 font-bold text-warning">
                        {r.reliability.toFixed(1)} <Star size={11} fill="currentColor" />
                      </span>
                      <span className="block text-[10px] text-muted">Güvenilirlik</span>
                    </span>
                    <span className="rounded-lg bg-surface-2 py-1.5">
                      <span className="font-bold">{r.confirmedMatches}</span>
                      <span className="block text-[10px] text-muted">Onaylı maç</span>
                    </span>
                    <span className="rounded-lg bg-surface-2 py-1.5">
                      <span className={r.noShows > 0 ? "font-bold text-danger" : "font-bold"}>{r.noShows}</span>
                      <span className="block text-[10px] text-muted">Gelmediği maç</span>
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => decide(r.playerId, "decline")}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-line py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      <X size={16} className="text-danger" /> Reddet
                    </button>
                    <button
                      type="button"
                      disabled={pending || full}
                      onClick={() => decide(r.playerId, "approve")}
                      title={full ? "Kadro dolu" : undefined}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-40"
                    >
                      <Check size={16} /> Onayla
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <SectionTitle>Onaylanan Kadro ({roster.length})</SectionTitle>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {roster.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar player={p} size={36} />
              <div className="min-w-0 flex-1">
                <Link href={`/oyuncu/${p.id}`} className="block truncate text-sm font-semibold hover:underline">
                  {p.name}
                </Link>
                <p className="text-xs text-muted">
                  {p.organizer ? "Organizatör" : p.position ? (POSITION_NAMES[p.position] ?? p.position) : "Mevki seçmedi"} · Seviye {p.level}
                </p>
              </div>
              {p.organizer ? (
                <Crown size={16} className="text-warning" aria-label="Organizatör" />
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  aria-label={`${p.name} adlı oyuncuyu kadrodan çıkar`}
                  onClick={() => {
                    if (window.confirm(`${p.name} kadrodan çıkarılsın mı?`)) act(`/api/matches/${matchId}/participants?player=${p.id}`, { method: "DELETE" });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
