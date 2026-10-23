"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

/** Bildirimlerdeki "Tümünü okundu işaretle" düğmesi: POST /api/notifications, ardından sayfa sunucudan yenilenir */
export function MarkAllRead({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Tümünü okundu işaretle"
      title="Tümünü okundu işaretle"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/notifications", { method: "POST" });
          router.refresh();
        })
      }
      className="flex justify-end text-primary disabled:opacity-30"
    >
      <CheckCheck size={22} />
    </button>
  );
}
