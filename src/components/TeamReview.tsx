"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, X } from "lucide-react";
import type { LineupSlot } from "@/lib/types";
import { BADGES } from "@/lib/badges";
import { XP_REWARDS } from "@/lib/gamification";
import { POSITION_NAMES, PRAISES } from "@/lib/praise";
import { Avatar, ProgressBar, cn } from "./ui";

interface Review {
  attended: boolean | null;
  praiseId: string | null;
}

/**
 * Maç sonu "Takımı Değerlendir" akışı.
 * Oyunlaştırma: Geldi/Gelmedi oyu güvenilirlik puanını besler (D6'daki 1 numaralı hedef),
 * övgüler sosyal tanınma sağlar, her değerlendirme "Adil Oyuncu" başarımına ilerletir.
 */
export function TeamReview({
  matchId,
  teammates,
  ratingsGivenBefore,
}: {
  matchId: string;
  teammates: LineupSlot[];
  ratingsGivenBefore: number;
}) {
  const [index, setIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(() => teammates.map(() => ({ attended: null, praiseId: null })));
  const finished = index >= teammates.length;

  if (finished) {
    return <Summary matchId={matchId} reviews={reviews} ratingsGivenBefore={ratingsGivenBefore} />;
  }

  const slot = teammates[index];
  const review = reviews[index];
  const update = (patch: Partial<Review>) =>
    setReviews((all) => all.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <main className="flex flex-1 flex-col">
      <header className="relative flex flex-col items-center px-4 pt-5 pb-3">
        <Link
          href={`/mac/${matchId}`}
          aria-label="Kapat"
          className="absolute top-5 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <X size={20} />
        </Link>
        <h1 className="font-semibold">Takımı Değerlendir</h1>
        <p className="text-xs font-semibold text-primary">
          {index + 1} / {teammates.length} Oyuncu
        </p>
      </header>

      <section className="mx-5 mt-4 rounded-3xl border border-line bg-surface p-5">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border-2 border-line p-1">
            <Avatar player={slot.player} size={72} badge="⚽" badgeTone="success" />
          </span>
          <h2 className="mt-3 text-2xl font-bold">{slot.player.name}</h2>
          <p className="text-sm text-muted">{POSITION_NAMES[slot.position] ?? slot.position}</p>
        </div>

        <hr className="my-5 border-dashed border-line" />

        <h3 className="text-center font-bold">Maça Geldi mi?</h3>
        <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Maça geldi mi">
          <button
            type="button"
            role="radio"
            aria-checked={review.attended === false}
            onClick={() => update({ attended: false, praiseId: null })}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border py-3 font-semibold transition",
              review.attended === false ? "border-danger bg-danger/15 text-danger" : "border-line bg-surface-2 text-fg",
            )}
          >
            <X size={18} className="text-danger" /> Gelmedi
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={review.attended === true}
            onClick={() => update({ attended: true })}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border py-3 font-semibold transition",
              review.attended === true ? "border-primary bg-primary text-on-primary" : "border-line bg-surface-2 text-fg",
            )}
          >
            <Check size={18} /> Geldi
          </button>
        </div>

        <hr className="my-5 border-dashed border-line" />

        <h3 className="text-center font-bold">Öne Çıkan Özelliği Neydi?</h3>
        <p className="text-center text-xs text-muted">(Bir övgü vererek profilini güçlendir)</p>
        <div className={cn("mt-3 grid grid-cols-2 gap-3", review.attended === false && "pointer-events-none opacity-40")}>
          {PRAISES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={review.praiseId === p.id}
              disabled={review.attended === false}
              onClick={() => update({ praiseId: review.praiseId === p.id ? null : p.id })}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-semibold transition",
                review.praiseId === p.id ? "border-primary bg-primary/10 text-primary" : "border-line bg-surface-2",
              )}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-auto px-5 pt-6 pb-8">
        <div className="mb-4">
          <ProgressBar value={index} max={teammates.length} tone="primary" />
        </div>
        <button
          type="button"
          disabled={review.attended === null}
          onClick={() => setIndex((i) => i + 1)}
          className="w-full rounded-xl bg-primary py-3.5 font-bold tracking-wide text-on-primary uppercase shadow-lg shadow-primary/30 transition disabled:opacity-40 disabled:shadow-none"
        >
          {index === teammates.length - 1 ? "Değerlendirmeyi Bitir" : "Sonraki Oyuncu"}
        </button>
        {review.attended === null && (
          <p className="mt-2 text-center text-xs text-muted">Devam etmek için &quot;Geldi&quot; ya da &quot;Gelmedi&quot; seç</p>
        )}
      </div>
    </main>
  );
}

function Summary({
  matchId,
  reviews,
  ratingsGivenBefore,
}: {
  matchId: string;
  reviews: Review[];
  ratingsGivenBefore: number;
}) {
  const xp = reviews.length * XP_REWARDS.ratedOthers;
  const praiseCount = reviews.filter((r) => r.praiseId).length;
  const fairPlay = BADGES.find((b) => b.id === "adil-oyuncu")!;
  const total = Math.min(ratingsGivenBefore + reviews.length, fairPlay.target);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
        <PartyPopper size={36} />
      </span>
      <h1 className="mt-5 text-2xl font-bold">Değerlendirme Tamamlandı</h1>
      <p className="mt-2 text-sm text-muted">
        {reviews.length} oyuncuyu değerlendirdin, {praiseCount} övgü verdin. Oylar, en az 3 kişi oy verdiğinde ve çoğunluk
        sağlandığında güvenilirlik puanına yansır.
      </p>

      <div className="mt-6 w-full rounded-2xl border border-line bg-surface p-4 text-left">
        <p className="text-sm font-bold text-primary">+{xp} XP</p>
        <p className="mt-3 text-sm font-semibold">{fairPlay.name} başarımı</p>
        <div className="mt-1 mb-1 flex justify-between text-xs text-muted">
          <span>{fairPlay.description}</span>
          <span>
            {total} / {fairPlay.target}
          </span>
        </div>
        <ProgressBar value={total} max={fairPlay.target} tone="primary" />
      </div>

      <Link
        href={`/mac/${matchId}`}
        className="mt-8 w-full rounded-xl bg-primary py-3.5 font-bold text-on-primary shadow-lg shadow-primary/30"
      >
        Maça Dön
      </Link>
    </main>
  );
}
