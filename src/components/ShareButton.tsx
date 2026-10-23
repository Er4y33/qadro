"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * "Başarını Paylaş": Telefonda işletim sisteminin paylaşım menüsünü açar (Web Share API: WhatsApp, Instagram…).
 * Desteklemeyen tarayıcıda (çoğu masaüstü) metni ve bağlantıyı panoya kopyalar.
 * Paylaşılan bağlantı herkese açık oyuncu profiline gider; önizleme görseli /oyuncu/[id]/opengraph-image'dan üretilir.
 * Paylaşım user_events'e "achievement_shared" olarak yazılır (Hook modeli: yatırım ve sosyal kanıt).
 */
export function ShareButton({
  title,
  text,
  path,
  label,
  variant = "button",
}: {
  title: string;
  text: string;
  path: string;
  label: string;
  /** "icon": başlık çubuğundaki küçük düğme (maç detayı) */
  variant?: "button" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        shared = true;
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        shared = true;
      }
    } catch {
      /* Kullanıcı paylaşım menüsünü kapattı */
    }
    if (shared) fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }).catch(() => {});
  };

  if (variant === "icon") {
    return (
      <button type="button" onClick={share} aria-label={label} title={copied ? "Bağlantı kopyalandı" : label} className="flex h-10 w-10 items-center justify-center text-muted">
        {copied ? <Check size={20} className="text-success" /> : <Share2 size={20} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/30"
    >
      {copied ? <Check size={18} /> : <Share2 size={18} />}
      {copied ? "Bağlantı kopyalandı" : label}
    </button>
  );
}
