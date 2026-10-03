"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Plus, Search, User } from "lucide-react";
import { cn } from "./ui";

const items = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/kesfet", label: "Keşfet", icon: Search },
  { href: "/sohbetler", label: "Sohbetler", icon: MessageSquare },
  { href: "/profil", label: "Profil", icon: User },
];

/** Alt menü ve ortadaki "Maç Oluştur" (+) butonu */
export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-surface/95 backdrop-blur">
      <div className="relative grid grid-cols-4 px-4 pt-3 pb-6">
        {items.map(({ href, label, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              "flex justify-center",
              i === 1 && "mr-8",
              i === 2 && "ml-8",
              isActive(href) ? "text-primary" : "text-muted",
            )}
          >
            <Icon size={24} strokeWidth={isActive(href) ? 2.4 : 1.8} />
          </Link>
        ))}
        <Link
          href="/mac/olustur"
          aria-label="Maç oluştur"
          className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-bg"
        >
          <Plus size={30} />
        </Link>
      </div>
    </nav>
  );
}
