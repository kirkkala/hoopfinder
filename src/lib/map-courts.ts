import type { ExplorerCourt } from "@/lib/courts";

/** Catalog plus pending pins for map UIs. */
export async function fetchMapCourts(
  signal?: AbortSignal,
): Promise<ExplorerCourt[]> {
  const catalogResponse = await fetch("/api/courts", { signal });
  if (!catalogResponse.ok) throw new Error("court list failed");
  const catalog = (await catalogResponse.json()) as { courts: ExplorerCourt[] };

  let pending: ExplorerCourt[] = [];
  try {
    const pendingResponse = await fetch("/api/submitted-courts", { signal });
    if (pendingResponse.ok) {
      const payload = (await pendingResponse.json()) as {
        courts?: ExplorerCourt[];
      };
      pending = payload.courts ?? [];
    }
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
  }

  return [...pending, ...catalog.courts];
}
