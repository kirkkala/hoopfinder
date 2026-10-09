import { afterEach, expect, test, vi } from "vitest";
import { adminEmails, isAdminEmail } from "./admin";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("reads admin addresses as a unique lowercase list and ignores stray text", () => {
  vi.stubEnv("ADMIN_EMAILS", " A@B.com, nope, a@b.com , c@d.fi ");
  expect(adminEmails()).toEqual(["a@b.com", "c@d.fi"]);
  expect(isAdminEmail("C@D.fi")).toBe(true);
  expect(isAdminEmail("  ")).toBe(false);
  expect(isAdminEmail(null)).toBe(false);
});
