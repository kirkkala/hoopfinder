/** Google accounts in `ADMIN_EMAILS` (comma-separated) can open `/admin`. */
export function adminEmails(): string[] {
  const emails = new Set<string>();
  for (const part of (process.env.ADMIN_EMAILS ?? "").split(",")) {
    const email = part.trim().toLowerCase();
    if (email.includes("@")) emails.add(email);
  }
  return [...emails];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/** Login redirect for an admin page. The callback stays on `/admin`. */
export function adminLoginPath(pathname: string, search = ""): string {
  const path = `${pathname}${search}`.split("?")[0] ?? "";
  const callback =
    path === "/admin" || path.startsWith("/admin/") ? `${pathname}${search}` : "/admin";
  return `/login?callbackUrl=${encodeURIComponent(callback)}`;
}
