"use client";

import { useCopy, useLocale } from "@/components/brand/LocaleProvider";
import { LOCALES, type Locale } from "@/lib/copy";

const LANGUAGE_LABEL: Record<Locale, string> = {
  fi: "Suomeksi",
  en: "In English",
};

const LANGUAGE_LABEL_SHORT: Record<Locale, string> = {
  fi: "FI",
  en: "EN",
};

export function LanguageToggle({
  stretch = false,
  short = false,
}: {
  stretch?: boolean;
  short?: boolean;
}) {
  const copy = useCopy();
  const { locale, setLocale } = useLocale();
  const labels = short ? LANGUAGE_LABEL_SHORT : LANGUAGE_LABEL;

  return (
    <div
      className={`flex shrink-0 rounded-full bg-white/10 p-0.5 text-xs font-bold ${
        stretch ? "w-full" : ""
      } ${short ? "tracking-wide" : ""}`}
      role="group"
      aria-label={copy.language}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          className={`rounded-full px-2.5 py-1.5 ${short ? "uppercase" : ""} ${
            stretch ? "flex-1" : ""
          } ${
            locale === option
              ? "bg-gold text-asphalt"
              : "text-ink/70 hover:text-white"
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
