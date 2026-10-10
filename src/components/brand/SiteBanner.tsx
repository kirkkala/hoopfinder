"use client";

import { Bug, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useCopy, useLocale } from "@/components/brand/LocaleProvider";

const DatabaseUnavailableContext = createContext(false);
const STORAGE_KEY = "hoopfinder-announcements-dismissed";

export function useDatabaseUnavailable() {
  return useContext(DatabaseUnavailableContext);
}

export type SiteBannerMessage = {
  tone: "error" | "warning" | "notice" | "status";
  fi: string;
  en: string;
  /** Visitor can hide this for the current browser session. */
  dismissible?: boolean;
};

type AnnouncementControls = {
  dismissed: SiteBannerMessage[];
  reopen: (message: SiteBannerMessage) => void;
  recallFocusId: string | null;
  clearRecallFocus: () => void;
};

const AnnouncementContext = createContext<AnnouncementControls | null>(null);

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
  const copy = useCopy();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [recallFocusId, setRecallFocusId] = useState<string | null>(null);

  useLayoutEffect(() => {
    setDismissedIds(readDismissed());
  }, []);

  const dismiss = useCallback((message: SiteBannerMessage) => {
    const id = announcementId(message);
    setRecallFocusId(id);
    setDismissedIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      writeDismissed(next);
      return next;
    });
  }, []);

  const reopen = useCallback((message: SiteBannerMessage) => {
    const id = announcementId(message);
    setRecallFocusId(null);
    setDismissedIds((current) => {
      const next = current.filter((item) => item !== id);
      writeDismissed(next);
      return next;
    });
  }, []);

  const clearRecallFocus = useCallback(() => setRecallFocusId(null), []);

  const dismissed = messages.filter(
    (message) => message.dismissible && dismissedIds.includes(announcementId(message)),
  );
  const visible = messages.filter(
    (message) => !message.dismissible || !dismissedIds.includes(announcementId(message)),
  );

  return (
    <DatabaseUnavailableContext.Provider value={databaseUnavailable}>
      <AnnouncementContext.Provider value={{ dismissed, reopen, recallFocusId, clearRecallFocus }}>
        <div className="flex h-dvh flex-col">
          {visible.map((message) => (
            <div
              key={announcementId(message)}
              className={`relative shrink-0 ${bannerClass(message.tone)}`}
            >
              <p
                role="status"
                className={`flex items-start justify-start gap-1.5 py-1 text-left text-sm leading-5 font-medium sm:justify-center sm:text-center ${
                  message.dismissible ? "pr-10 pl-3 sm:px-10" : "px-3"
                }`}
              >
                <BannerIcon tone={message.tone} />
                <span className="min-w-0">{message[locale]}</span>
              </p>
              {message.dismissible ? (
                <button
                  type="button"
                  onClick={() => dismiss(message)}
                  aria-label={copy.closeAnnouncement}
                  className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-full outline-none hover:bg-black/15 focus-visible:ring-2 focus-visible:ring-current"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
          ))}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </AnnouncementContext.Provider>
    </DatabaseUnavailableContext.Provider>
  );
}

/** Banner-colored control that brings a closed announcement back. */
export function ShowAnnouncementButton() {
  const controls = useContext(AnnouncementContext);
  if (!controls || controls.dismissed.length === 0) return null;

  return controls.dismissed.map((message) => (
    <RecallButton
      key={announcementId(message)}
      message={message}
      focus={controls.recallFocusId === announcementId(message)}
      onFocused={controls.clearRecallFocus}
      onClick={() => controls.reopen(message)}
    />
  ));
}

function RecallButton({
  message,
  focus,
  onFocused,
  onClick,
}: {
  message: SiteBannerMessage;
  focus: boolean;
  onFocused: () => void;
  onClick: () => void;
}) {
  const copy = useCopy();
  const { locale } = useLocale();
  const ref = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!focus) return;
    ref.current?.focus();
    onFocused();
  }, [focus, onFocused]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`${copy.showAnnouncement}: ${message[locale]}`}
      className={`grid size-8 shrink-0 place-items-center rounded-full outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-gold/60 ${bannerClass(message.tone)}`}
    >
      <BannerGlyph tone={message.tone} className="size-4" />
    </button>
  );
}

function announcementId(message: SiteBannerMessage) {
  return `${message.tone}:${message.fi}`;
}

function readDismissed(): string[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  try {
    if (ids.length === 0) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private mode — the choice still applies until the next full load.
  }
}

function bannerClass(tone: SiteBannerMessage["tone"]) {
  if (tone === "error") return "bg-red-600 text-white";
  if (tone === "warning") return "bg-yellow-400 text-asphalt";
  if (tone === "notice") return "bg-blue-600 text-white";
  return "bg-green-600 text-white";
}

function BannerIcon({ tone }: { tone: SiteBannerMessage["tone"] }) {
  return <BannerGlyph tone={tone} className="mt-0.5 size-4 shrink-0" />;
}

function BannerGlyph({ tone, className }: { tone: SiteBannerMessage["tone"]; className: string }) {
  if (tone === "error") return <Bug className={className} aria-hidden />;
  if (tone === "warning") return <TriangleAlert className={className} aria-hidden />;
  if (tone === "notice") return <Info className={className} aria-hidden />;
  return <CircleCheck className={className} aria-hidden />;
}
