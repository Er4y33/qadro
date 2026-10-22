"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { DEMO_STEPS } from "@/lib/demo-steps";
import { startDemoTour } from "./DemoGuide";

/** Demo verisini sıfırlar, demo oyuncusu olarak giriş yapar ve turun ilk ekranını açar */
export function DemoStart({ label = "Demoyu Başlat" }: { label?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const start = () =>
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/demo/start", { method: "POST" });
      if (!res.ok) {
        setError("Demo başlatılamadı. Sayfayı yenileyip tekrar dene.");
        return;
      }
      startDemoTour();
      router.push(DEMO_STEPS[0].path);
      router.refresh();
    });

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-on-primary shadow-lg shadow-primary/30 disabled:opacity-60 sm:w-auto"
      >
        <Play size={18} fill="currentColor" /> {pending ? "Demo hazırlanıyor..." : label}
      </button>
      {error && (
        <p className="mt-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
