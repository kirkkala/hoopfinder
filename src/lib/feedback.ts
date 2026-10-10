import { z } from "zod";

export const FEEDBACK_PER_HOUR = 5;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.union([z.literal(""), z.email().max(254)]));

/** Public write. `company` is a honeypot: people never see it, bots often fill it. */
export const FeedbackSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  email: emailField.optional().default(""),
  company: z.string().max(500).optional().default(""),
});

export const FeedbackNotesSchema = z.object({
  notes: z.string().trim().max(4000),
});

export type FeedbackInput = z.infer<typeof FeedbackSchema>;

export type AdminFeedback = {
  id: string;
  title: string;
  body: string;
  email: string | null;
  notes: string;
  createdAt: string;
};

export function isBotFeedback(company: string): boolean {
  return company.trim().length > 0;
}
