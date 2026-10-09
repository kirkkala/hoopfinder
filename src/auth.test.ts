import { afterEach, expect, test, vi } from "vitest";
import { googleAuthConfigured, safeCallbackUrl } from "./auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("allows an in-app path and rejects login, api, and off-site redirects", () => {
  expect(safeCallbackUrl("/courts/lipas/82547")).toBe("/courts/lipas/82547");
  expect(safeCallbackUrl(undefined)).toBe("/admin");
  expect(safeCallbackUrl(["//evil.example", "/courts"])).toBe("/admin");
  expect(safeCallbackUrl("/login")).toBe("/admin");
  expect(safeCallbackUrl("/api/courts")).toBe("/admin");
  expect(safeCallbackUrl("https://evil.example")).toBe("/admin");
  expect(safeCallbackUrl("", "/")).toBe("/");
});

test("treats Google sign-in as configured only when every secret is set", () => {
  vi.stubEnv("AUTH_SECRET", "secret");
  vi.stubEnv("GOOGLE_CLIENT_ID", "id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
  expect(googleAuthConfigured()).toBe(false);

  vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
  expect(googleAuthConfigured()).toBe(true);
});
