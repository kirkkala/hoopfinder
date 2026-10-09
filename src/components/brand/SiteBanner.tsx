"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Bug, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useLocale } from "@/components/brand/LocaleProvider";

const DatabaseUnavailableContext = createContext(false);

export function useDatabaseUnavailable() {
  return useContext(DatabaseUnavailableContext);
}

export type SiteBannerMessage = {
  tone: "error" | "warning" | "notice" | "status";
  fi: string;
  en: string;
};

export function SiteBanner({
  messages,
  databaseUnavailable = false,
  children,
}: {
  messages: SiteBannerMessage[];
  databaseUnavailable?: boolean;
  children: ReactNode;
}) {
  const { locale } = useLocale();
  return (
    <DatabaseUnavailableContext.Provider value={databaseUnavailable}>
      {messages.map((message) => (
        <p
          key={`${message.tone}:${message.fi}`}
          role="status"
          className={`flex items-center justify-center gap-1.5 px-3 py-1 text-center text-sm leading-5 font-medium ${bannerClass(message.tone)}`}
        >
          <BannerIcon tone={message.tone} />
          {message[locale]}
        </p>
      ))}
      {children}
    </DatabaseUnavailableContext.Provider>
  );
}

function bannerClass(tone: SiteBannerMessage["tone"]) {
  if (tone === "error") return "bg-red-600 text-white";
  if (tone === "warning") return "bg-yellow-400 text-asphalt";
  if (tone === "notice") return "bg-blue-600 text-white";
  return "bg-green-600 text-white";
}

function BannerIcon({ tone }: { tone: SiteBannerMessage["tone"] }) {
  const className = "size-4 shrink-0";
  if (tone === "error") return <Bug className={className} aria-hidden />;
  if (tone === "warning") return <TriangleAlert className={className} aria-hidden />;
  if (tone === "notice") return <Info className={className} aria-hidden />;
  return <CircleCheck className={className} aria-hidden />;
}
