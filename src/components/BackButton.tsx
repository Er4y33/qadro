"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Geçmiş varsa bir önceki sayfaya, yoksa (bağlantıyla doğrudan gelindiyse) ana sayfaya döner */
export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Geri"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
    >
      <ChevronLeft size={20} />
    </button>
  );
}
