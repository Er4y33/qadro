"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Home, MessageSquare, Plus, Search, Trophy, User } from "lucide-react";
import { Avatar, cn } from "./ui";

const items = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/kesfet", label: "Keşfet", icon: Search },
  { href: "/sohbetler", label: "Sohbetler", icon: MessageSquare },
  { href: "/bildirimler", label: "Bildirimler", icon: Bell },
  { href: "/siralama", label: "Şehrin En İyileri", icon: Trophy },
  { href: "/panel", label: "Davranış Paneli", icon: BarChart3 },
  { href: "/profil", label: "Profil", icon: User },
];

interface Me {
  name: string;
  initials: string;
  color: string;
}

/**
 * Masaüstü kenar menüsü (yalnızca geniş ekranda, lg: ≥1024px görünür).
 * Telefonda bunun yerine alttaki BottomNav kullanılır; ikisi aynı sayfalara gider.
 * Kullanıcı bilgisi istemcide /api/auth/me ile alınır; böylece kök düzen statik kalır
 * ve SSG / ISR sayfaları her istekte yeniden üretilmek zorunda kalmaz.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <Link href="/" className="flex items-center gap-2 px-3 text-2xl font-black tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base text-on-primary">Q</span>
        QADRO
      </Link>

      <Link
        href="/mac/olustur"
        className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-on-primary shadow-lg shadow-primary/30"
      >
        <Plus size={20} /> Maç Oluştur
      </Link>

      <nav className="mt-6 flex flex-col gap-1" aria-label="Ana menü">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive(href) ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon size={20} strokeWidth={isActive(href) ? 2.4 : 1.8} />
            {label}
          </Link>
        ))}
      </nav>

      {me && (
        <Link href="/profil" className="mt-auto flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
          <Avatar player={me} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{me.name}</span>
            <span className="block text-xs text-muted">Profili gör</span>
          </span>
        </Link>
      )}
    </aside>
  );
}
