"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/components/ui";

const slides = [
  {
    title: ["Eksik Oyuncu", "Derdine Son!"],
    text: "Çevrendeki halı saha, basketbol veya voleybol maçlarını anında bul. Hemen takımını kur ve sahaya in.",
    art: <FieldArt />,
  },
  {
    title: ["Doğru Rakibi", "Bul & Eşleş"],
    text: "Kendi yetenek seviyendeki oyuncularla eşleş. Ne çok kolay, ne de imkânsız; tam dişine göre maçlar seni bekliyor.",
    art: <VersusArt />,
  },
  {
    title: ["Oyna ve", "Seviye Atla"],
    text: "Maçlara katıldıkça istatistiklerini geliştir. Qadro puanını yükselt ve şehrinin en değerli oyuncusu ol!",
    art: <LevelArt />,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const last = i === slides.length - 1;
  const slide = slides[i];

  return (
    <main className="flex flex-1 flex-col px-7 pt-6 pb-10">
      <div className="flex justify-end">
        <Link href="/giris" className={cn("rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary", last && "invisible")}>
          Geç
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-8">{slide.art}</div>

      <h1 className="text-3xl leading-tight font-bold">
        {slide.title[0]}
        <br />
        {slide.title[1]}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">{slide.text}</p>

      <div className="mt-12 flex items-center justify-between">
        <div className="flex gap-1.5" aria-label={`${slides.length} adımdan ${i + 1}.`}>
          {slides.map((_, j) => (
            <span key={j} className={cn("h-1.5 rounded-full transition-all", j === i ? "w-6 bg-primary" : "w-1.5 bg-muted/50")} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (last ? router.push("/giris") : setI(i + 1))}
          aria-label={last ? "Başla" : "Sonraki"}
          className={cn("flex h-12 w-14 items-center justify-center rounded-full text-on-primary", last ? "bg-success" : "bg-primary")}
        >
          {last ? <Check size={22} /> : <ChevronRight size={22} />}
        </button>
      </div>
    </main>
  );
}

function FieldArt() {
  return (
    <div className="flex h-44 w-44 items-center justify-center rounded-full bg-primary/15 ring-[20px] ring-primary/10">
      <div className="relative h-24 w-36 rounded-[50%] border-4 border-dashed border-primary">
        <span className="absolute -top-5 -right-4 rounded-full bg-primary px-2.5 py-3 text-[10px] font-bold text-on-primary">Qadro</span>
      </div>
    </div>
  );
}

function VersusArt() {
  return (
    <div className="relative flex h-40 w-64 items-center justify-center">
      <span className="absolute left-4 h-36 w-36 rounded-full bg-primary/20" />
      <span className="absolute right-4 h-36 w-36 rounded-full bg-success/20" />
      <span className="absolute left-12 h-20 w-20 rounded-full bg-primary" />
      <span className="absolute right-12 h-20 w-20 rounded-full bg-success" />
      <span className="relative rounded-md bg-bg px-1.5 py-1 text-[10px] font-bold">VS</span>
    </div>
  );
}

function LevelArt() {
  return (
    <div className="relative flex h-32 w-44 items-end justify-center gap-3 rounded-2xl border border-line bg-surface p-5">
      <span className="h-8 w-5 rounded bg-muted/50" />
      <span className="h-14 w-5 rounded bg-primary" />
      <span className="h-20 w-5 rounded bg-success" />
      <span className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-warning text-xs font-bold text-white">Lvl</span>
    </div>
  );
}
