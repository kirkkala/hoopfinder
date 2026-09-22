import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getCourtCatalog } from "@/lib/catalog";
import {
  courtHref,
  courtPlacementBlocked,
  emptyAmenities,
  isTooCloseToCourt,
  submittedCourtKey,
  type Court,
  type ExplorerCourt,
} from "@/lib/courts";
import { withDb } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/email";
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
  | "outside-finland"
  | "email";

export type SubmittedStatus = "unconfirmed" | "pending" | "published";

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
  id: number | string;
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
    id: String(row.id),
    name: row.name,
    address: row.address,
    email: row.email,
    lat: row.lat,
    lon: row.lon,
    status: asSubmittedStatus(row.status),
    createdAt: toIso(row.created_at),
  }));
}

export async function getSubmittedCourt(
  id: string,
): Promise<{ court: Court; createdAt: string } | null> {
  const key = submittedCourtKey(id);
  if (!/^\d+$/.test(key)) return null;
  const rows = await withDb((sql) => {
    return sql<AdminRow[]>`
      SELECT id, name, address, email, lat, lon, status, created_at
      FROM submitted_courts
      WHERE id = ${key}
      LIMIT 1
    `;
  });
  const row = rows?.[0];
  if (!row) return null;
  return { court: toCourt(row), createdAt: toIso(row.created_at) };
}

export async function createSubmittedCourt(
  input: SubmittedCourtInput,
  origin: string,
): Promise<{ court: ExplorerCourt } | { error: SubmittedCourtError }> {
  if (!isInFinland(input.lat, input.lon)) {
    return { error: "outside-finland" };
  }

  const { courts } = await getCourtCatalog();
  if (isTooCloseToCourt(input, courts)) {
    return { error: "too-close" };
  }

  const token = randomBytes(32).toString("base64url");
  const created = await withDb(async (sql) => {
    const existing = await sql<SubmittedRow[]>`
      SELECT id, name, address, lat, lon, status, created_at
      FROM submitted_courts
    `;
    if (courtPlacementBlocked(input, existing)) {
      return { error: "too-close" as const };
    }

    const rows = await sql<SubmittedRow[]>`
      INSERT INTO submitted_courts (
        name, address, email, lat, lon, status, confirmation_token
      )
      VALUES (
        ${input.name},
        ${input.address},
        ${input.email},
        ${input.lat},
        ${input.lon},
        'unconfirmed',
        ${token}
      )
      RETURNING id, name, address, lat, lon, status, created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("submitted court insert returned no row");
    return { id: String(row.id), court: toExplorerCourt(row) };
  });

  if (!created) return { error: "unavailable" };
  if ("error" in created) return created;

  const sent = await sendTemplateEmail({
    to: input.email,
    template: "hoop-add-confirmation-link",
    variables: {
      COURT_NAME: input.name,
      COURT_ADD_CONFIRMATION_LINK: `${origin}/add/confirm/${token}`,
    },
  });
  if ("error" in sent) {
    await withDb(
      (sql) => sql`
        DELETE FROM submitted_courts
        WHERE id = ${created.id} AND status = 'unconfirmed'
      `,
    );
    return { error: "email" };
  }

  return { court: created.court };
}

/** Court id like `submitted-10014`, or null when the link is not valid. */
export async function confirmSubmittedCourt(token: string): Promise<string | null> {
  if (!/^[\w-]{20,128}$/.test(token)) return null;
  const result = await withDb(async (sql) => {
    const rows = await sql<{ id: number | string }[]>`
      UPDATE submitted_courts
      SET status = CASE WHEN status = 'unconfirmed' THEN 'pending' ELSE status END
      WHERE confirmation_token = ${token}
      RETURNING id
    `;
    const row = rows[0];
    return row ? `submitted-${row.id}` : null;
  });
  return result ?? null;
}

export async function setSubmittedCourtStatus(
  id: string,
  status: Exclude<SubmittedStatus, "unconfirmed">,
  origin: string,
): Promise<
  { court: ExplorerCourt } | { error: "unavailable" | "not-found" | "email" }
> {
  const key = submittedCourtKey(id);
  if (!/^\d+$/.test(key)) return { error: "not-found" };
  const updated = await withDb(async (sql) => {
    const rows = await sql<(SubmittedRow & { email: string })[]>`
      UPDATE submitted_courts
      SET status = ${status}
      WHERE id = ${key}
        AND status = ${status === "published" ? "pending" : "published"}
      RETURNING id, name, address, email, lat, lon, status, created_at
    `;
    const row = rows[0];
    return row
      ? { court: toExplorerCourt(row), email: row.email }
      : { error: "not-found" as const };
  });

  if (!updated) return { error: "unavailable" };
  if ("error" in updated) return updated;
  if (status !== "published") return { court: updated.court };

  const sent = await sendTemplateEmail({
    to: updated.email,
    template: "hoop-add-confirmed",
    variables: {
      PUBLISHED_COURT_URL: `${origin}${courtHref(updated.court)}`,
    },
  });
  if ("error" in sent) {
    await withDb(
      (sql) => sql`
        UPDATE submitted_courts
        SET status = 'pending'
        WHERE id = ${key} AND status = 'published'
      `,
    );
    return { error: "email" };
  }

  return { court: updated.court };
}

export async function deleteSubmittedCourt(
  id: string,
): Promise<{ ok: true } | { error: "unavailable" | "not-found" }> {
  const key = submittedCourtKey(id);
  if (!/^\d+$/.test(key)) return { error: "not-found" };
  const deleted = await withDb(async (sql) => {
    const rows = await sql<{ id: number | string }[]>`
      DELETE FROM submitted_courts
      WHERE id = ${key}
      RETURNING id
    `;
    return rows[0] ? { ok: true as const } : { error: "not-found" as const };
  });
  return deleted ?? { error: "unavailable" };
}

function toExplorerCourt(row: SubmittedRow): ExplorerCourt {
  const id = `submitted-${row.id}`;
  if (asSubmittedStatus(row.status) === "published") {
    return {
      id,
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
    id,
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
    emailConfirmed: asSubmittedStatus(row.status) === "pending",
  };
}

function toCourt(row: SubmittedRow): Court {
  return {
    id: `submitted-${row.id}`,
    source: "submitted",
    name: row.name,
    nameFi: row.name,
    status: asSubmittedStatus(row.status) === "published" ? "active" : "pending",
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
    emailConfirmed: asSubmittedStatus(row.status) !== "unconfirmed",
  };
}

function asSubmittedStatus(value: string): SubmittedStatus {
  if (value === "published" || value === "unconfirmed") return value;
  return "pending";
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
