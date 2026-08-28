"use client";

import { useEffect, useState } from "react";
import { THEMES, THEME_LABELS, THEME_SWATCH, THEME_STORAGE_KEY, DEFAULT_THEME, isTheme, type Theme } from "@/lib/theme";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (isTheme(current)) setTheme(current);
  }, []);

  function applyTheme(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode etc.) - theme just won't persist
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => applyTheme(t)}
          title={THEME_LABELS[t]}
          aria-label={`${THEME_LABELS[t]} theme`}
          aria-pressed={theme === t}
          className={`h-5 w-5 rounded-full transition-shadow ${
            theme === t ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-surface" : "ring-1 ring-line"
          }`}
          style={{ backgroundColor: THEME_SWATCH[t] }}
        />
      ))}
    </div>
  );
}
