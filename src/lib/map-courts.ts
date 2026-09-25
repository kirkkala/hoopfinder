import type { ExplorerCourt } from "@/lib/courts";

async function fetchPendingCourts(signal?: AbortSignal): Promise<ExplorerCourt[]> {
  try {
    const response = await fetch("/api/submitted-courts", { signal });
    if (!response.ok) return [];
    const payload = (await response.json()) as { courts?: ExplorerCourt[] };
    return payload.courts ?? [];
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return [];
  }
}

/** Catalog plus pending pins for map UIs. */
export async function fetchMapCourts(
  signal?: AbortSignal,
): Promise<ExplorerCourt[]> {
  const [catalogResponse, pending] = await Promise.all([
    fetch("/api/courts", { signal }),
    fetchPendingCourts(signal),
  ]);
  if (!catalogResponse.ok) throw new Error("court list failed");
  const catalog = (await catalogResponse.json()) as { courts: ExplorerCourt[] };
  return [...pending, ...catalog.courts];
}
