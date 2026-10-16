"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/giris");
          router.refresh();
        })
      }
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 py-3 text-sm font-semibold text-danger disabled:opacity-50"
    >
      <LogOut size={16} /> {pending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </button>
  );
}
