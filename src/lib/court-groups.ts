import { COURT_MATCH_KM, type Court, isGenericCourtName } from "@/lib/courts";
import { haversineKm } from "@/lib/geo";

/** Same address, same administrator, and this close: one place even when the names differ. */
const ADDRESS_MATCH_KM = 0.05;

export type GroupedCourts = {
  courts: Court[];
  placeById: Map<string, Court>;
  sourceById: Map<string, Court>;
};

/**
 * Fold LIPAS pads that are one place into a single public court.
 * Source rows stay intact in `sourceById` so photos and old ids keep their paths.
 */
export function groupCourtPlaces(courts: Court[]): GroupedCourts {
  const sourceById = new Map<string, Court>();
  for (const court of courts) rememberSource(court, sourceById);

  const lipas = courts.filter((court) => court.source === "lipas");
  const groups = clusterLipas(lipas);
  const placeByMember = new Map<string, Court>();
  for (const group of groups) {
    const place = toPlace(group);
    for (const member of group) placeByMember.set(member.id, place);
  }

  const placeById = new Map<string, Court>();
  const publicCourts: Court[] = [];
  const emitted = new Set<string>();
  for (const court of courts) {
    const place = court.source === "lipas" ? placeByMember.get(court.id) : undefined;
    const shown = withAliasList(place ?? court);
    if (emitted.has(shown.id)) continue;
    emitted.add(shown.id);
    publicCourts.push(shown);
    rememberPlace(shown, placeById);
  }

  return { courts: publicCourts, placeById, sourceById };
}

/**
 * The pad this address asked for.
 * A folded source id has no page of its own, so it stays on the place's first court.
 */
export function courtOnPlace(place: Court, id: string): Court {
  const members = place.members;
  if (!members || members.length < 2) return place;
  return members.find((member) => member.id === id) ?? members[0];
}

/** Public court pages. A grouped place counts each hoop, not the single map pin. */
export function courtPageCount(courts: Court[]): number {
  return courts.reduce((total, court) => total + (court.members?.length || 1), 0);
}

/** Every court whose photos belong on this page: the pads, plus anything folded in. */
export function courtsWithPhotos(court: Court): Court[] {
  const items = [...(court.members ?? [court]), ...(court.hidden ?? [])];
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function clusterLipas(courts: Court[]): Court[][] {
  const parent = courts.map((_, index) => index);
  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };
  const union = (left: number, right: number) => {
    const a = find(left);
    const b = find(right);
    if (a !== b) parent[a] = b;
  };

  for (let i = 0; i < courts.length; i++) {
    for (let j = i + 1; j < courts.length; j++) {
      if (samePlace(courts[i], courts[j])) union(i, j);
    }
  }

  const groups = new Map<number, Court[]>();
  courts.forEach((court, index) => {
    const root = find(index);
    const group = groups.get(root);
    if (group) group.push(court);
    else groups.set(root, [court]);
  });
  return [...groups.values()];
}

function samePlace(a: Court, b: Court): boolean {
  const km = haversineKm(a, b);
  const name = venueKey(a.nameFi);
  if (name && name === venueKey(b.nameFi) && km < COURT_MATCH_KM) return true;
  const address = addressKey(a);
  return address !== null && address === addressKey(b) && km < ADDRESS_MATCH_KM;
}

function venueKey(name: string): string | null {
  const stem = nameStem(name);
  if (!stem || isGenericCourtName(stem)) return null;
  return normalize(stem);
}

function addressKey(court: Court): string | null {
  if (!court.address || !court.admin) return null;
  return `${normalize(court.city ?? "")}|${normalize(court.address)}|${court.admin}`;
}

function toPlace(group: Court[]): Court {
  if (group.length < 2) return group[0];
  const ordered = [...group].sort(byCourtId);
  const primary = ordered[0];
  const hidden = ordered.flatMap((court) => court.hidden ?? []);
  const aliases = unique([
    ...ordered.slice(1).map((court) => court.id),
    ...hidden.map((court) => court.id),
  ]);
  return {
    ...primary,
    name: nameStem(primary.name) ?? primary.name,
    nameFi: nameStem(primary.nameFi) ?? primary.nameFi,
    members: ordered,
    hidden: hidden.length > 0 ? hidden : undefined,
    aliases: aliases.length > 0 ? aliases : undefined,
    nearby: ordered.slice(1).map((court) => ({ lat: court.lat, lon: court.lon })),
  };
}

function withAliasList(court: Court): Court {
  if (court.aliases?.length) return court;
  const aliases = unique((court.hidden ?? []).map((item) => item.id));
  if (aliases.length === 0) return court;
  return { ...court, aliases };
}

function rememberSource(court: Court, sourceById: Map<string, Court>) {
  sourceById.set(court.id, court);
  for (const hidden of court.hidden ?? []) rememberSource(hidden, sourceById);
}

function rememberPlace(court: Court, placeById: Map<string, Court>) {
  placeById.set(court.id, court);
  for (const id of court.aliases ?? []) placeById.set(id, court);
  for (const hidden of court.hidden ?? []) placeById.set(hidden.id, court);
}

function nameStem(name: string): string | null {
  if (name.includes(" / ")) {
    const stem = name.split(" / ")[0]?.trim();
    return stem || null;
  }
  const numbered = /^(.*\D)\s+\d+\s*$/.exec(name);
  const stem = numbered?.[1]?.trim();
  return stem || null;
}

function byCourtId(a: Court, b: Court): number {
  const left = Number(a.id);
  const right = Number(b.id);
  if (Number.isFinite(left) && Number.isFinite(right) && left !== right) return left - right;
  return a.id.localeCompare(b.id);
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
