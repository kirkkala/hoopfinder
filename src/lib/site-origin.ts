import { SITE_URL } from "@/lib/constants";

type HeaderReader = { get(name: string): string | null };

/** Public site origin for links in emails. Falls back to production. */
export function siteOrigin(source: Request | HeaderReader): string {
  const headers = source instanceof Request ? source.headers : source;
  const host = (headers.get("x-forwarded-host") ?? headers.get("host"))
    ?.split(",")[0]
    ?.trim();
  if (!host) return SITE_URL;
  const protocol =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${protocol}://${host}`;
}
