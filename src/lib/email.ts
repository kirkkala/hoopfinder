import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult = { id: string } | { error: "unconfigured" | "failed" };

/** Sends one transactional email through Resend. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.error("Email is not configured");
    return { error: "unconfigured" };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  if (error || !data) {
    console.error("Email send failed", error);
    return { error: "failed" };
  }

  return { id: data.id };
}
