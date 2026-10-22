"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronUp, Compass, X } from "lucide-react";
import { DEMO_STEPS, DEMO_STORAGE_KEY } from "@/lib/demo-steps";
import { cn } from "./ui";

interface DemoState {
  step: number;
  collapsed: boolean;
}

function read(): DemoState | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoState) : null;
  } catch {
    return null;
  }
}

function write(state: DemoState | null) {
  try {
    if (state) localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    /* Tarayıcı depolamaya izin vermiyorsa rehber yalnızca bu sayfada çalışır */
  }
  window.dispatchEvent(new Event("qadro-demo"));
}

/** /demo sayfasındaki "Demoyu Başlat" butonu turu bu fonksiyonla açar */
export function startDemoTour() {
  write({ step: 0, collapsed: false });
}

/**
 * Rehberli demo turu kartı. Tur açıkken her ekranda sağ altta (telefonda alt menünün üstünde) görünür:
 * bu ekranda ne denenecek, hangi oyun mekaniği çalışıyor ve hangi kurama dayanıyor.
 */
export function DemoGuide() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<DemoState | null>(null);

  useEffect(() => {
    const sync = () => setState(read());
    sync();
    window.addEventListener("qadro-demo", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("qadro-demo", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!state || pathname === "/demo") return null;
  const index = Math.min(Math.max(state.step, 0), DEMO_STEPS.length - 1);
  const step = DEMO_STEPS[index];
  const onStepScreen = pathname === step.path;
  const isLast = index === DEMO_STEPS.length - 1;

  const go = (next: number) => {
    const target = DEMO_STEPS[next];
    write({ step: next, collapsed: false });
    router.push(target.path);
  };

  return (
    <aside
      aria-label="Demo turu"
      className={cn(
        "fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-[404px] rounded-2xl border border-primary/50 bg-surface shadow-2xl shadow-black/40",
        "lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-[380px] lg:max-w-none",
      )}
    >
      <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <Compass size={16} className="shrink-0 text-primary" />
        <p className="min-w-0 flex-1 truncate text-xs font-bold tracking-wide text-primary uppercase">
          Demo turu · {index + 1} / {DEMO_STEPS.length}
        </p>
        <button
          type="button"
          onClick={() => write({ ...state, collapsed: !state.collapsed })}
          aria-label={state.collapsed ? "Rehberi aç" : "Rehberi küçült"}
          className="rounded-md p-1 text-muted hover:text-fg"
        >
          {state.collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <button type="button" onClick={() => write(null)} aria-label="Turu kapat" className="rounded-md p-1 text-muted hover:text-fg">
          <X size={18} />
        </button>
      </header>

      {!state.collapsed && (
        <div className="max-h-[34dvh] overflow-y-auto px-4 py-3 lg:max-h-[70dvh]">
          <h2 className="text-base leading-snug font-bold text-balance">{step.title}</h2>

          {!onStepScreen && (
            <Link
              href={step.path}
              className="mt-2 flex items-center justify-between rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning"
            >
              Bu adımın ekranı başka bir sayfada <ArrowRight size={14} />
            </Link>
          )}

          <p className="mt-3 text-[11px] font-bold tracking-wide text-muted uppercase">Dene</p>
          <p className="mt-0.5 text-sm">{step.todo}</p>

          <p className="mt-3 text-[11px] font-bold tracking-wide text-muted uppercase">Mekanik</p>
          <p className="mt-0.5 text-sm text-muted">{step.mechanic}</p>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-muted uppercase">
            <BookOpen size={12} /> Kuram
          </p>
          <ul className="mt-1 space-y-1.5">
            {step.theory.map((t) => (
              <li key={t.name} className="rounded-lg bg-surface-2 px-3 py-2 text-xs">
                <span className="font-bold text-primary">{t.name}:</span> {t.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Geri
        </button>
        <span className="flex flex-1 justify-center gap-1" aria-hidden>
          {DEMO_STEPS.map((s, i) => (
            <span key={s.id} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-primary" : "bg-line")} />
          ))}
        </span>
        {isLast ? (
          <Link
            href="/demo?bitti=1"
            onClick={() => write(null)}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
          >
            Turu Bitir
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
          >
            Sonraki <ArrowRight size={14} />
          </button>
        )}
      </footer>
    </aside>
  );
}
