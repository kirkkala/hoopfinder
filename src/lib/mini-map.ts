import { type Court, type ExplorerCourt, toExplorerCourt } from "@/lib/courts";

/** The page court is this pin, including a pad that shares the place's map dot. */
function pinMatchesPage(pin: ExplorerCourt, court: Court): boolean {
  return pin.id === court.id || pin.aliases?.includes(court.id) === true;
}

/**
 * Pins to draw. The page court is enough until the catalog arrives,
 * so the court page does not wait on the full list.
 */
export function pinsForMiniMap(court: Court, loaded: ExplorerCourt[]): ExplorerCourt[] {
  if (loaded.length === 0) return [toExplorerCourt(court)];
  if (loaded.some((pin) => pinMatchesPage(pin, court))) return loaded;
  return [toExplorerCourt(court), ...loaded];
}

export function currentPinId(court: Court, pins: ExplorerCourt[]): string {
  return pins.find((pin) => pinMatchesPage(pin, court))?.id ?? court.id;
}
