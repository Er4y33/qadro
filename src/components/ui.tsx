/**
 * Küçük, tekrar kullanılan arayüz parçaları.
 * Figma'daki bileşenlerin kod karşılıklarıdır.
 */
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Player } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Baş harfli yuvarlak avatar; isteğe bağlı seviye rozeti ile */
export function Avatar({
  player,
  size = 40,
  badge,
  badgeTone = "warning",
  className,
}: {
  player: Pick<Player, "initials" | "color">;
  size?: number;
  badge?: string | number;
  badgeTone?: "warning" | "success";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        /* Yeşil avatarlarda koyu, diğer renklerde beyaz yazı */
        /primary|success/.test(player.color) ? "text-on-primary" : "text-white",
        player.color,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {player.initials}
      {badge !== undefined && (
        <span
          className={cn(
            "absolute -top-1 -right-2 rounded-full px-1.5 py-px text-[10px] font-bold leading-4",
            badgeTone === "warning" ? "bg-warning text-white" : "bg-success text-on-primary",
          )}
        >
          {badge}
        </span>
      )}
    </span>
  );
}

export function ProgressBar({ value, max, tone }: { value: number; max: number; tone: "primary" | "warning" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full rounded-full", tone === "primary" ? "bg-primary" : "bg-warning")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Geri oklu, ortalanmış başlıklı ekran üst çubuğu */
export function ScreenHeader({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="grid grid-cols-[40px_1fr_40px] items-center px-4 pt-5 pb-3">
      <Link href={backHref} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-fg">
        <ChevronLeft size={24} />
      </Link>
      <h1 className="text-center text-base font-semibold">{title}</h1>
      <div className="flex justify-end">{right}</div>
    </header>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}
