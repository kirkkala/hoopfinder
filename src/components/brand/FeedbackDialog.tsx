"use client";

import { X } from "lucide-react";
import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { FeedbackSchema } from "@/lib/feedback";

const FeedbackContext = createContext<{
  open: boolean;
  openFeedback: () => void;
} | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openFeedback = useCallback(() => setOpen(true), []);
  return (
    <FeedbackContext.Provider value={{ open, openFeedback }}>
      {children}
      <FeedbackDialog open={open} onClose={() => setOpen(false)} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}

const FIELD_CLASS =
  "w-full rounded-xl border border-white/25 bg-asphalt px-3 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm";

export function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const copy = useCopy();
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const attempt = useRef(0);
  const titleId = useId();
  const headingId = useId();
  const messageId = useId();
  const emailId = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    attempt.current += 1;
    if (!open) return;
    setTitle("");
    setBody("");
    setEmail("");
    setSending(false);
    setDone(false);
    setError(null);
    if (honeypotRef.current) honeypotRef.current.value = "";
  }, [open]);

  useEffect(() => {
    if (open && !done) titleRef.current?.focus();
  }, [open, done]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const company = honeypotRef.current?.value ?? "";
    const parsed = FeedbackSchema.safeParse({ title, body, email, company });
    if (!parsed.success) {
      setError(copy.feedbackInvalid);
      return;
    }
    const current = attempt.current;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (current !== attempt.current) return;
      if (response.status === 429) {
        setError(copy.feedbackRateLimited);
        return;
      }
      if (!response.ok) {
        setError(response.status === 400 ? copy.feedbackInvalid : copy.feedbackUnavailable);
        return;
      }
      setDone(true);
    } catch {
      if (current !== attempt.current) return;
      setError(copy.feedbackUnavailable);
    } finally {
      if (current === attempt.current) setSending(false);
    }
  }

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby={headingId}
      className="intro-dialog m-0 max-h-dvh w-full max-w-none overflow-y-auto overscroll-contain bg-transparent p-4 text-ink outline-none open:grid open:h-dvh backdrop:bg-black/70"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-panel shadow-[0_24px_64px_rgb(0_0_0_/_0.55)] sm:max-w-lg">
        <div className="court-arc pointer-events-none absolute inset-0 rounded-3xl opacity-40" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-panel/80 p-1.5 text-ink-muted hover:bg-white/10 hover:text-white"
          aria-label={copy.close}
        >
          <X className="size-4" aria-hidden />
        </button>
        <div className="relative px-6 pt-6 pb-5">
          <h2 id={headingId} className="font-display text-3xl tracking-wide text-white">
            {copy.feedbackTitle}
          </h2>
          {done ? (
            <div className="mt-4">
              <p className="text-base leading-6 text-ink/85">{copy.feedbackThanks}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 w-full rounded-full bg-gold px-4 py-3 text-base font-bold text-asphalt hover:bg-[#ffe0a3]"
              >
                {copy.close}
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)} className="mt-3" noValidate>
              <p className="text-base leading-6 text-ink/80">{copy.feedbackLead}</p>
              <label htmlFor={titleId} className="mt-5 block">
                <FieldLabel required>{copy.feedbackFieldTitle}</FieldLabel>
                <input
                  ref={titleRef}
                  id={titleId}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  required
                  disabled={sending}
                  className={`${FIELD_CLASS} h-11`}
                />
              </label>
              <label htmlFor={messageId} className="mt-4 block">
                <FieldLabel required>{copy.feedbackFieldMessage}</FieldLabel>
                <textarea
                  id={messageId}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={4000}
                  required
                  disabled={sending}
                  rows={5}
                  className={`${FIELD_CLASS} py-2.5`}
                />
              </label>
              <label htmlFor={emailId} className="mt-4 block">
                <FieldLabel>{copy.feedbackFieldEmail}</FieldLabel>
                <input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  disabled={sending}
                  className={`${FIELD_CLASS} h-11`}
                />
                <span className="mt-1 block text-sm text-ink-muted">{copy.feedbackEmailHint}</span>
              </label>
              {/* Bots fill every field. People never see this one. A value is dropped. */}
              <div className="h-0 overflow-hidden" aria-hidden="true">
                <label>
                  Company
                  <input
                    ref={honeypotRef}
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                  />
                </label>
              </div>
              {error ? (
                <p role="alert" className="mt-4 text-sm text-red-400">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={sending}
                className="mt-6 w-full rounded-full bg-gold px-4 py-3 text-base font-bold text-asphalt hover:bg-[#ffe0a3] disabled:cursor-wait disabled:opacity-70"
              >
                {sending ? copy.feedbackSending : copy.feedbackSend}
              </button>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}

function FieldLabel({ required = false, children }: { required?: boolean; children: string }) {
  const copy = useCopy();
  return (
    <span className="mb-1 block text-sm font-bold text-ink/85">
      {children}
      {required ? (
        <>
          <span aria-hidden className="text-gold">
            {" "}
            *
          </span>
          <span className="sr-only"> ({copy.feedbackRequiredMark})</span>
        </>
      ) : null}
    </span>
  );
}
