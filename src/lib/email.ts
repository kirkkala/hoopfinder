import { Resend } from "resend";

const CONFIRMATION_TEMPLATE_ID = "hoop-add-confirmation-link";

export async function sendCourtConfirmationEmail(input: {
  to: string;
  courtName: string;
  confirmUrl: string;
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
    template: {
      id: CONFIRMATION_TEMPLATE_ID,
      variables: {
        COURT_NAME: input.courtName,
        COURT_ADD_CONFIRMATION_LINK: input.confirmUrl,
      },
    },
  });

  if (error || !data) {
    console.error("Email send failed", error);
    return { error: "failed" };
  }

  return { id: data.id };
}
