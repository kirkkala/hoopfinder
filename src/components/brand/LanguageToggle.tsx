"use client";

import { useCopy, useLocale } from "@/components/brand/LocaleProvider";
import { LOCALES } from "@/lib/copy";

export function LanguageToggle() {
  const copy = useCopy();
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex shrink-0 rounded-full bg-white/10 p-0.5 text-[11px] font-bold tracking-wide"
      role="group"
      aria-label={copy.language}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          className={`rounded-full px-2 py-1 uppercase ${
            locale === option
              ? "bg-gold text-asphalt"
              : "text-cream/70 hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
