import { afterEach, expect, test, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendTemplateEmail } from "./email";

afterEach(() => {
  send.mockReset();
  vi.unstubAllEnvs();
});

const message = {
  to: "visitor@example.com",
  template: "hoop-add-confirmation-link",
  variables: { COURT_NAME: "Kallio" },
};

test("logs the message and does not call Resend when email is log-only", async () => {
  vi.stubEnv("EMAIL_LOG_ONLY", "1");
  vi.stubEnv("RESEND_API_KEY", "key");
  vi.stubEnv("EMAIL_FROM", "Hoop Finder <noreply@hoopfinder.fi>");
  const info = vi.spyOn(console, "info").mockImplementation(() => {});

  await expect(sendTemplateEmail(message)).resolves.toEqual({ id: "log-only" });
  expect(send).not.toHaveBeenCalled();
  expect(info).toHaveBeenCalledWith("Email log only", message);
});

test("reports email as unconfigured when the key or sender is blank", async () => {
  vi.stubEnv("EMAIL_LOG_ONLY", "");
  vi.stubEnv("RESEND_API_KEY", "  ");
  vi.stubEnv("EMAIL_FROM", "Hoop Finder <noreply@hoopfinder.fi>");

  await expect(sendTemplateEmail(message)).resolves.toEqual({ error: "unconfigured" });
  expect(send).not.toHaveBeenCalled();
});

test("returns the provider id, or a failure when Resend does not accept the message", async () => {
  vi.stubEnv("EMAIL_LOG_ONLY", "");
  vi.stubEnv("RESEND_API_KEY", "key");
  vi.stubEnv("EMAIL_FROM", "Hoop Finder <noreply@hoopfinder.fi>");
  send.mockResolvedValueOnce({ data: { id: "email_1" }, error: null });

  await expect(sendTemplateEmail(message)).resolves.toEqual({ id: "email_1" });
  expect(send).toHaveBeenCalledWith({
    from: "Hoop Finder <noreply@hoopfinder.fi>",
    to: message.to,
    template: { id: message.template, variables: message.variables },
  });

  send.mockResolvedValueOnce({ data: null, error: { message: "rejected" } });
  await expect(sendTemplateEmail(message)).resolves.toEqual({ error: "failed" });
});
