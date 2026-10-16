import { MAP_PATH } from "@/lib/constants";

/** Set once the visitor has seen the about page or the short court-page note. */
export const VISITED_COOKIE = "hoopfinder-visited";

/**
 * Storage from the old first-visit dialog. Removed in one place so earlier
 * visitors do not keep a key nothing reads anymore.
 */
const OBSOLETE_LOCAL_STORAGE_KEYS = ["hoopfinder-intro-seen"] as const;

const VISITED_MAX_AGE = 60 * 60 * 24 * 365;

export function clearObsoleteStorage() {
  try {
    for (const key of OBSOLETE_LOCAL_STORAGE_KEYS) localStorage.removeItem(key);
  } catch {
    // Private mode can block storage. Nothing else depends on the cleanup.
  }
}

export function hasVisited(): boolean {
  try {
    return document.cookie.split("; ").some((part) => part === `${VISITED_COOKIE}=1`);
  } catch {
    return false;
  }
}

export function markVisited() {
  writeVisitedCookie("1", VISITED_MAX_AGE);
}

export function clearVisited() {
  writeVisitedCookie("", 0);
}

function writeVisitedCookie(value: string, maxAge: number) {
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: the next request has to see this without a server action
    document.cookie = `${VISITED_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {
    // Ignore blocked cookies. The about page still renders.
  }
}

/** Where `/` should go, if it should not show the about page. */
export function homeEntryTarget(input: {
  visited: boolean;
  showHome: boolean;
  court: string | null;
  thanks: boolean;
}): { href: string; permanent: boolean } | null {
  if (input.court || input.thanks) {
    const query = new URLSearchParams();
    if (input.court) query.set("court", input.court);
    if (input.thanks) query.set("thanks", "1");
    return { href: `${MAP_PATH}?${query}`, permanent: true };
  }
  if (input.visited && !input.showHome) return { href: MAP_PATH, permanent: false };
  return null;
}
