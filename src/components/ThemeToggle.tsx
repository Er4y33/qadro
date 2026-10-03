"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as Theme) ?? "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("qadro-theme", next);
    } catch {
      /* Gizli sekmede localStorage kapalı olabilir; tema yine de değişir */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      className="flex h-10 w-10 items-center justify-center rounded-full text-fg"
    >
      {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}
