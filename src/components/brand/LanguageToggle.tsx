"use client";

import { useCopy, useLocale } from "@/components/brand/LocaleProvider";
import { LOCALES } from "@/lib/copy";

export function LanguageToggle({ stretch = false }: { stretch?: boolean }) {
  const copy = useCopy();
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`flex shrink-0 rounded-full bg-white/10 p-0.5 text-xs font-bold tracking-wide ${
        stretch ? "w-full" : ""
      }`}
      role="group"
      aria-label={copy.language}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          className={`rounded-full px-2.5 py-1.5 uppercase ${
            stretch ? "flex-1" : ""
          } ${
            locale === option
              ? "bg-gold text-asphalt"
              : "text-ink/70 hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
