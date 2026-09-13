"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  getCopy,
  isLocale,
  type Copy,
  type Locale,
} from "@/lib/copy";

const STORAGE_KEY = "hoopfinder-locale";
const CHANGE_EVENT = "hoopfinder-locale";

const LocaleContext = createContext<{
  locale: Locale;
  copy: Copy;
  setLocale: (locale: Locale) => void;
} | null>(null);

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Private mode or blocked storage — stay on Finnish.
  }
  return DEFAULT_LOCALE;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore quota / private-mode failures.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      copy: getCopy(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useCopy(): Copy {
  return useContext(LocaleContext)?.copy ?? getCopy();
}

export function useLocale() {
  const context = useContext(LocaleContext);
  return {
    locale: context?.locale ?? DEFAULT_LOCALE,
    setLocale: context?.setLocale ?? (() => {}),
  };
}
