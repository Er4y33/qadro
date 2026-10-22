"use client";

import { usePathname } from "next/navigation";
import { DesktopNav } from "./DesktopNav";
import { DemoGuide } from "./DemoGuide";
import { cn } from "./ui";

/** Giriş yapmadan görülen sayfalar: kenar menü gösterilmez, kendi bölünmüş ekran düzenleri vardır */
const PUBLIC_PREFIXES = ["/hosgeldin", "/giris", "/kayit", "/demo"];

/**
 * Uygulamanın dış çerçevesi (responsive).
 * - Telefon (< 1024px): 430px genişliğinde tek kolon, altta sekme menüsü.
 * - Masaüstü (lg, ≥ 1024px): solda 256px kenar menü, sağda tam genişlik içerik.
 *   Her sayfa kendi genişliğini seçer: geniş sayfalar ızgara kullanır, odaklı akışlar (maç oluştur,
 *   değerlendirme, sohbet) ortada dar bir kolonda kalır.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <>
      {!isPublic && <DesktopNav />}
      <div
        className={cn(
          "qadro-stripes mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg shadow-2xl shadow-black/20",
          "lg:max-w-none lg:shadow-none",
          !isPublic && "lg:pl-64",
        )}
      >
        {children}
      </div>
      {/* Rehberli demo turu açıksa her ekranda görünür (src/lib/demo-steps.ts) */}
      <DemoGuide />
    </>
  );
}

/**
 * Odaklı akışlar için dar kolon (maç oluşturma, değerlendirme, sohbet odası, S.O.S…).
 * Telefonda etkisi yoktur; masaüstünde içeriği 520px genişlikte ortalar.
 */
export function FocusColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[520px] lg:border-x lg:border-line">{children}</div>;
}
