import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";
export type ThemePreference = "auto" | "dark" | "light";

export const THEME_STORAGE_KEY = "only-alfa-theme-preference";

/**
 * Определение текущей системной темы ОС пользователя (macOS, Windows, iOS, Android).
 */
export function getSystemTheme(): ThemeMode {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

/**
 * Считывание сохранённого предпочтения: по умолчанию 'auto' (системная тема).
 */
export function readStoredPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "auto") {
      return raw;
    }
  } catch {
    /* private mode / blocked storage */
  }
  return "auto";
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#F5F5F7" : "#080809");
  }
}

/**
 * Синхронизация темы перед первым рендером (вызывается из main.tsx).
 */
export function initTheme(): ThemeMode {
  const pref = readStoredPreference();
  const theme = pref === "auto" ? getSystemTheme() : pref;
  applyTheme(theme);
  return theme;
}

/**
 * Хук темы:
 * - По умолчанию автоматически следует системным настройкам ОС пользователя (prefers-color-scheme).
 * - Реагирует в реальном времени при смене темы в ОС (например, при наступлении вечера или переключении в Control Center).
 * - Предоставляет ручное переключение: 'auto' | 'light' | 'dark'.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference());
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(() => getSystemTheme());

  // Слушатель системной темы ОС в реальном времени
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if ("addListener" in mediaQuery) {
      // Поддержка старых браузеров
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  const activeTheme: ThemeMode = preference === "auto" ? systemTheme : preference;

  // Применение темы к DOM и сохранение пользовательского выбора
  useEffect(() => {
    applyTheme(activeTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* ignore */
    }
  }, [activeTheme, preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const setTheme = useCallback((next: ThemeMode | "auto") => {
    setPreferenceState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((prev) => {
      const current = prev === "auto" ? getSystemTheme() : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  return {
    theme: activeTheme,
    preference,
    setPreference,
    setTheme,
    toggleTheme,
    isLight: activeTheme === "light",
    isDark: activeTheme === "dark",
    isAuto: preference === "auto",
  };
}
