import { SITE_URL } from "@/lib/constants";

/** Public site origin for links in emails. Falls back to production. */
export function siteOrigin(request: Request): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    ?.split(",")[0]
    ?.trim();
  if (!host) return SITE_URL;
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${protocol}://${host}`;
}
