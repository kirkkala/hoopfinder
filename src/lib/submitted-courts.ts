import { z } from "zod";
import { getCourtCatalog } from "@/lib/catalog";
import {
  emptyAmenities,
  isTooCloseToCourt,
  type Court,
  type ExplorerCourt,
} from "@/lib/courts";
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

export type SubmittedStatus = "pending" | "published";

export type AdminSubmittedCourt = {
  id: string;
  name: string;
  address: string;
  email: string;
  lat: number;
  lon: number;
  status: SubmittedStatus;
  createdAt: string;
};

type SubmittedRow = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  status: SubmittedStatus;
  created_at: Date | string;
};

type AdminRow = SubmittedRow & {
  email: string;
  created_at: Date | string;
};

export async function listSubmittedCourts(): Promise<ExplorerCourt[]> {
  const rows = await withDb((sql) => {
    return sql<SubmittedRow[]>`
      SELECT id, name, address, lat, lon, status, created_at
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

export async function listAdminSubmittedCourts(): Promise<
  AdminSubmittedCourt[] | null
> {
  const rows = await withDb((sql) => {
    return sql<AdminRow[]>`
      SELECT id, name, address, email, lat, lon, status, created_at
      FROM submitted_courts
      ORDER BY created_at DESC
    `;
  });
  if (!rows) return null;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    email: row.email,
    lat: row.lat,
    lon: row.lon,
    status: asSubmittedStatus(row.status),
    createdAt: toIso(row.created_at),
  }));
}

export async function getPublishedSubmittedCourt(
  id: string,
): Promise<{ court: Court; createdAt: string } | null> {
  const rows = await withDb((sql) => {
    return sql<AdminRow[]>`
      SELECT id, name, address, email, lat, lon, status, created_at
      FROM submitted_courts
      WHERE id = ${id} AND status = 'published'
      LIMIT 1
    `;
  });
  const row = rows?.[0];
  if (!row) return null;
  return { court: toCourt(row), createdAt: toIso(row.created_at) };
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
      SELECT id, name, address, lat, lon, status, created_at
      FROM submitted_courts
    `;
    if (isTooCloseToCourt(input, existing)) {
      return { error: "too-close" as const };
    }

    const [seq] = await sql<{ n: string }[]>`
      SELECT nextval('submitted_court_id_seq')::text AS n
    `;
    if (!seq) throw new Error("submitted court sequence returned no value");
    const id = `submitted-${seq.n}`;
    const rows = await sql<SubmittedRow[]>`
      INSERT INTO submitted_courts (id, name, address, email, lat, lon)
      VALUES (${id}, ${input.name}, ${input.address}, ${input.email}, ${input.lat}, ${input.lon})
      RETURNING id, name, address, lat, lon, status, created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("submitted court insert returned no row");
    return { court: toExplorerCourt(row) };
  });

  return created ?? { error: "unavailable" };
}

export async function setSubmittedCourtStatus(
  id: string,
  status: SubmittedStatus,
): Promise<{ court: ExplorerCourt } | { error: "unavailable" | "not-found" }> {
  const updated = await withDb(async (sql) => {
    const rows = await sql<SubmittedRow[]>`
      UPDATE submitted_courts
      SET status = ${status}
      WHERE id = ${id}
      RETURNING id, name, address, lat, lon, status, created_at
    `;
    const row = rows[0];
    return row ? { court: toExplorerCourt(row) } : { error: "not-found" as const };
  });

  return updated ?? { error: "unavailable" };
}

function toExplorerCourt(row: SubmittedRow): ExplorerCourt {
  if (asSubmittedStatus(row.status) === "published") {
    return {
      id: row.id,
      source: "submitted",
      name: row.name,
      nameFi: row.name,
      status: "active",
      address: row.address,
      city: null,
      neighborhood: null,
      lat: row.lat,
      lon: row.lon,
      amenities: { lighting: null, freeUse: null },
    };
  }

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
    createdAt: toIso(row.created_at),
  };
}

function toCourt(row: SubmittedRow): Court {
  return {
    id: row.id,
    source: "submitted",
    name: row.name,
    nameFi: row.name,
    status: "active",
    address: row.address,
    postalCode: null,
    city: null,
    neighborhood: null,
    lat: row.lat,
    lon: row.lon,
    comment: null,
    website: null,
    constructionYear: null,
    owner: null,
    admin: null,
    amenities: emptyAmenities(),
  };
}

function asSubmittedStatus(value: string): SubmittedStatus {
  return value === "published" ? "published" : "pending";
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
