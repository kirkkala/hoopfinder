import { afterEach, expect, test, vi } from "vitest";
import { adminEmails, adminLoginPath, isAdminEmail } from "./admin";

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

test("sends a signed-out visitor to login and keeps the admin page as the return path", () => {
  expect(adminLoginPath("/admin/photos")).toBe("/login?callbackUrl=%2Fadmin%2Fphotos");
  expect(adminLoginPath("/admin/edits", "?x=1")).toBe(
    "/login?callbackUrl=%2Fadmin%2Fedits%3Fx%3D1",
  );
  expect(adminLoginPath("/admin")).toBe("/login?callbackUrl=%2Fadmin");
  expect(adminLoginPath("//evil.example")).toBe("/login?callbackUrl=%2Fadmin");
  expect(adminLoginPath("/login")).toBe("/login?callbackUrl=%2Fadmin");
});
