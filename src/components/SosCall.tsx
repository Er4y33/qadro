"use client";

import { POSITIONS } from "@/lib/sports";
import type { Sport } from "@/lib/types";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { CITY } from "@/lib/leaderboard";
import { cn } from "./ui";


/**
 * S.O.S (Joker) çağrısı: Maça kısa süre kala eksik kalan kadroyu tamamlamak için
 * çevredeki uygun oyunculara öncelikli bildirim gönderir.
 * Çağrı POST /api/sos ile veritabanına kaydedilir ve kadroda olmayan oyuncuların Bildirimler ekranına düşer.
 * Oyunlaştırma: Çağrıya yanıt veren oyuncu "Kurtarıcı" başarımına ilerler (Philanthropist tipi).
 */
export function SosCall({
  matchId,
  matchTitle,
  sport,
  eligible,
}: {
  matchId: string;
  matchTitle: string;
  sport: Sport;
  /** Çağrıyı görecek oyuncu sayısı: kadroda olmayan herkes */
  eligible: number;
}) {
  const positions = POSITIONS[sport];
  const [position, setPosition] = useState(positions[0]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () =>
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, position }),
      });
      if (res.status === 201) setSent(true);
      else setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Çağrı gönderilemedi.");
    });
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Geri sayım yalnızca tarayıcıda başlar; sunucu ile istemci arasında saat farkı oluşmasın diye.
  useEffect(() => {
    setSecondsLeft(105 * 60);
    const t = setInterval(() => setSecondsLeft((s) => (s && s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const clock =
    secondsLeft === null
      ? "--:--:--"
      : [Math.floor(secondsLeft / 3600), Math.floor((secondsLeft % 3600) / 60), secondsLeft % 60]
          .map((n) => String(n).padStart(2, "0"))
          .join(":");

  return (
    <main className="flex flex-1 flex-col px-5 pt-5 pb-8">
      <header className="relative flex items-center justify-center">
        <Link
          href={`/mac/${matchId}`}
          aria-label="Kapat"
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <X size={20} />
        </Link>
        <p className="text-sm font-bold tracking-wide text-primary">S.O.S ÇAĞRISI</p>
      </header>

      {/* Radar */}
      <div className="relative mx-auto mt-10 flex h-56 w-56 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rounded-full border border-dashed border-primary/30" />
        <span className="absolute inset-8 rounded-full border-2 border-primary/50" />
        {sent && <span className="absolute inset-8 animate-ping rounded-full border-2 border-primary/60" />}
        <span className="absolute top-1/2 left-1/2 h-0.5 w-1/2 origin-left bg-gradient-to-r from-primary to-transparent motion-safe:animate-spin [animation-duration:3s]" />
        <span className="absolute top-10 left-12 h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="absolute right-10 bottom-14 h-2.5 w-2.5 rounded-full bg-primary/70" />
        <span className="absolute top-20 right-6 h-2 w-2 rounded-full bg-muted" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 ring-8 ring-primary/10">
          <span className="h-6 w-6 rounded-full border-4 border-primary bg-bg" />
        </span>
      </div>

      <h1 className="mt-8 text-center text-2xl font-bold">{sent ? "Sinyal Gönderildi!" : "Acil Adam Lazım!"}</h1>
      <p className="mt-2 text-center text-sm text-muted">
        {sent
          ? `${CITY} çevresindeki oyunculara ${position.toLocaleLowerCase("tr-TR")} çağrısı ulaştı. İlk kabul eden kadroya eklenir.`
          : `${CITY} çevresindeki ${eligible} uygun oyuncuya yüksek öncelikli radar bildirimi gidecek.`}
      </p>

      <h2 className="mt-8 mb-3 text-sm font-bold">İhtiyaç Duyulan Mevki</h2>
      <div className="flex gap-2" role="radiogroup" aria-label="İhtiyaç duyulan mevki">
        {positions.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={position === p}
            disabled={sent}
            onClick={() => setPosition(p)}
            className={cn(
              "rounded-full border px-5 py-2 text-sm font-semibold transition disabled:opacity-60",
              position === p ? "border-primary bg-primary text-on-primary" : "border-line bg-surface",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-line bg-surface px-4 py-3">
        <span className="text-sm font-semibold">{matchTitle}</span>
        <span className="font-mono text-sm font-bold text-danger" aria-label="Maça kalan süre">
          {clock}
        </span>
      </div>

      <p className="mt-3 text-center text-[11px] text-muted">
        Çağrıya yanıt veren oyuncu <span className="font-semibold text-primary">Kurtarıcı</span> başarımına ilerler.
      </p>

      {error && <p className="mt-4 text-center text-sm font-semibold text-danger" role="alert">{error}</p>}

      <div className="mt-auto pt-6">
        {sent ? (
          <Link
            href={`/mac/${matchId}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 py-3.5 font-bold text-primary"
          >
            <Check size={18} /> Maça Dön
          </Link>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={pending}
            className="w-full disabled:opacity-60 rounded-xl bg-primary py-3.5 font-bold tracking-wide text-on-primary uppercase shadow-lg shadow-primary/30"
          >
            {pending ? "Gönderiliyor..." : "Sinyali Gönder"}
          </button>
        )}
      </div>
    </main>
  );
}
