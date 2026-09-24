import { Resend } from "resend";

export async function sendTemplateEmail(input: {
  to: string | string[];
  template: string;
  variables: Record<string, string>;
}): Promise<{ id: string } | { error: "unconfigured" | "failed" }> {
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
    template: { id: input.template, variables: input.variables },
  });

  if (error || !data) {
    console.error("Email send failed", error);
    return { error: "failed" };
  }

  return { id: data.id };
}
