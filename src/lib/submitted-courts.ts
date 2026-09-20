import { z } from "zod";
import { getCourtCatalog } from "@/lib/catalog";
import { isTooCloseToCourt, type ExplorerCourt } from "@/lib/courts";
import { withDb } from "@/lib/db";
import { isInFinland } from "@/lib/sources/finland";

export const SubmittedCourtSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  lat: z.number().finite(),
  lon: z.number().finite(),
});

export type SubmittedCourtInput = z.infer<typeof SubmittedCourtSchema>;

export type SubmittedCourtError =
  | "unavailable"
  | "invalid"
  | "too-close"
  | "outside-finland";

type SubmittedRow = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
};

export async function listSubmittedCourts(): Promise<ExplorerCourt[]> {
  const rows = await withDb((sql) => {
    return sql<SubmittedRow[]>`
      SELECT id, name, address, lat, lon
      FROM submitted_courts
      ORDER BY created_at DESC
    `;
  });
  if (!rows) return [];
  const { courts } = await getCourtCatalog();
  return rows
    .filter((row) => !isTooCloseToCourt(row, courts))
    .map(toExplorerCourt);
}

export async function createSubmittedCourt(
  input: SubmittedCourtInput,
): Promise<{ court: ExplorerCourt } | { error: SubmittedCourtError }> {
  if (!isInFinland(input.lat, input.lon)) {
    return { error: "outside-finland" };
  }

  const { courts } = await getCourtCatalog();
  if (isTooCloseToCourt(input, courts)) {
    return { error: "too-close" };
  }

  const created = await withDb(async (sql) => {
    const existing = await sql<SubmittedRow[]>`
      SELECT id, name, address, lat, lon
      FROM submitted_courts
    `;
    if (isTooCloseToCourt(input, existing)) {
      return { error: "too-close" as const };
    }

    const id = `submitted-${crypto.randomUUID()}`;
    const rows = await sql<SubmittedRow[]>`
      INSERT INTO submitted_courts (id, name, address, email, lat, lon)
      VALUES (${id}, ${input.name}, ${input.address}, ${input.email}, ${input.lat}, ${input.lon})
      RETURNING id, name, address, lat, lon
    `;
    const row = rows[0];
    if (!row) throw new Error("submitted court insert returned no row");
    return { court: toExplorerCourt(row) };
  });

  return created ?? { error: "unavailable" };
}

function toExplorerCourt(row: SubmittedRow): ExplorerCourt {
  return {
    id: row.id,
    source: "pending",
    name: row.name,
    nameFi: row.name,
    status: "pending",
    address: row.address,
    city: null,
    neighborhood: null,
    lat: row.lat,
    lon: row.lon,
    amenities: { lighting: null, freeUse: null },
  };
}
