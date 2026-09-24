import { randomBytes } from "node:crypto";
import { cache } from "react";
import { z } from "zod";
import { getCourtCatalog } from "@/lib/catalog";
import {
  ADMIN_CODES,
  COURT_STATUS_CODES,
  courtHref,
  courtPlacementBlocked,
  emptyAmenities,
  FIELD_TYPE_CODES,
  HOOP_HEIGHT_CODES,
  isTooCloseToCourt,
  OWNER_CODES,
  submittedCourtKey,
  SURFACE_CODES,
  WATER_POINT_CODES,
  type Court,
  type ExplorerCourt,
} from "@/lib/courts";
import { adminEmails } from "@/lib/admin";
import { withDb } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/email";
import { isInFinland } from "@/lib/sources/finland";

const triState = z.enum(["yes", "no"]).nullable().optional();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => value || null);

export const SubmittedCourtSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  lat: z.number().finite(),
  lon: z.number().finite(),
  courtStatus: z.enum(COURT_STATUS_CODES).nullable().optional(),
  website: optionalText(300),
  comment: optionalText(2000),
  constructionYear: z.number().int().min(1850).max(2100).nullable().optional(),
  owner: z.enum(OWNER_CODES).nullable().optional(),
  admin: z.enum(ADMIN_CODES).nullable().optional(),
  lighting: triState,
  lightingInfo: optionalText(300),
  freeUse: triState,
  schoolUse: triState,
  fieldType: z.enum(FIELD_TYPE_CODES).nullable().optional(),
  surfaceMaterial: z.array(z.enum(SURFACE_CODES)).max(SURFACE_CODES.length).optional(),
  surfaceMaterialInfo: optionalText(300),
  lengthM: z.number().positive().max(200).nullable().optional(),
  widthM: z.number().positive().max(200).nullable().optional(),
  areaM2: z.number().positive().max(20000).nullable().optional(),
  toilet: triState,
  heightAdjustable: triState,
  hoopHeight: z.enum(HOOP_HEIGHT_CODES).nullable().optional(),
  waterPoint: z.enum(WATER_POINT_CODES).nullable().optional(),
  matchClock: triState,
  scoreboard: triState,
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
  court: Court;
};

type SubmittedRow = {
  id: number | string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  status: SubmittedStatus;
  created_at: Date | string;
  details?: unknown;
};

type AdminRow = SubmittedRow & {
  email: string;
  created_at: Date | string;
};

export async function listSubmittedCourts(): Promise<ExplorerCourt[]> {
  const rows = await withDb((sql) => {
    return sql<SubmittedRow[]>`
      SELECT id, name, address, lat, lon, status, created_at, details
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

/** Catalog courts plus submitted courts that are not already covered by it. */
export const countPublicCourts = cache(async (): Promise<number> => {
  const { courts } = await getCourtCatalog();
  try {
    const submitted = await listSubmittedCourts();
    return courts.length + submitted.length;
  } catch (error) {
    console.error(error);
    return courts.length;
  }
});

export async function listAdminSubmittedCourts(): Promise<
  AdminSubmittedCourt[] | null
> {
  const rows = await withDb((sql) => {
    return sql<AdminRow[]>`
      SELECT id, name, address, email, lat, lon, status, created_at, details
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
    court: toCourt(row),
  }));
}

export async function getSubmittedCourt(
  id: string,
): Promise<{ court: Court; createdAt: string; email: string } | null> {
  const key = submittedCourtKey(id);
  if (!/^\d+$/.test(key)) return null;
  const rows = await withDb((sql) => {
    return sql<AdminRow[]>`
      SELECT id, name, address, email, lat, lon, status, created_at, details
      FROM submitted_courts
      WHERE id = ${key}
      LIMIT 1
    `;
  });
  const row = rows?.[0];
  if (!row) return null;
  return { court: toCourt(row), createdAt: toIso(row.created_at), email: row.email };
}

const COURT_SUBMISSIONS_PER_HOUR = 5;

/** Five new courts per address per hour. Counts the attempt, including a failed email send. */
export async function takeCourtSubmissionSlot(ip: string): Promise<boolean | null> {
  return withDb(async (sql) => {
    await sql`
      DELETE FROM court_submission_limits
      WHERE created_at < NOW() - INTERVAL '1 day'
    `;
    const rows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM court_submission_limits
      WHERE ip = ${ip} AND created_at > NOW() - INTERVAL '1 hour'
    `;
    if (Number(rows[0]?.count ?? 0) >= COURT_SUBMISSIONS_PER_HOUR) return false;
    await sql`INSERT INTO court_submission_limits (ip) VALUES (${ip})`;
    return true;
  });
}

export function courtSubmissionIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
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
        name, address, email, lat, lon, status, confirmation_token, details
      )
      VALUES (
        ${input.name},
        ${input.address},
        ${input.email},
        ${input.lat},
        ${input.lon},
        'unconfirmed',
        ${token},
        ${sql.json(storedDetails(input))}
      )
      RETURNING id, name, address, lat, lon, status, created_at, details
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
export async function confirmSubmittedCourt(
  token: string,
  origin: string,
): Promise<string | null | { error: "email" }> {
  if (!/^[\w-]{20,128}$/.test(token)) return null;
  const confirmed = await withDb(async (sql) => {
    const rows = await sql<
      { id: number | string; name: string; email: string; previous_status: string }[]
    >`
      UPDATE submitted_courts AS court
      SET status = CASE WHEN court.status = 'unconfirmed' THEN 'pending' ELSE court.status END
      FROM (
        SELECT id, status
        FROM submitted_courts
        WHERE confirmation_token = ${token}
      ) AS previous
      WHERE court.id = previous.id
      RETURNING court.id, court.name, court.email, previous.status AS previous_status
    `;
    const row = rows[0];
    return row
      ? {
          id: String(row.id),
          name: row.name,
          email: row.email,
          justConfirmed: row.previous_status === "unconfirmed",
        }
      : null;
  });
  if (!confirmed) return confirmed ?? null;
  if (!confirmed.justConfirmed) return `submitted-${confirmed.id}`;

  const admins = adminEmails();
  const sent =
    admins.length === 0
      ? { error: "unconfigured" as const }
      : await sendTemplateEmail({
          to: admins,
          template: "admin-verification-notification",
          variables: {
            USER_EMAIL: confirmed.email,
            COURT_NAME: confirmed.name,
            ADMIN_PAGE_URL: `${origin}/admin`,
          },
        });
  if ("error" in sent) {
    await withDb(
      (sql) => sql`
        UPDATE submitted_courts
        SET status = 'unconfirmed'
        WHERE id = ${confirmed.id} AND status = 'pending'
      `,
    );
    return { error: "email" };
  }

  return `submitted-${confirmed.id}`;
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
    const rows = await sql<(SubmittedRow & { email: string; previous_status: string })[]>`
      UPDATE submitted_courts AS court
      SET status = ${status}
      FROM (
        SELECT id, status
        FROM submitted_courts
        WHERE id = ${key}
      ) AS previous
      WHERE court.id = previous.id
        AND (
          (${status} = 'published' AND previous.status IN ('unconfirmed', 'pending'))
          OR (${status} = 'pending' AND previous.status = 'published')
        )
      RETURNING court.id, court.name, court.address, court.email, court.lat, court.lon,
        court.status, court.created_at, previous.status AS previous_status
    `;
    const row = rows[0];
    return row
      ? {
          court: toExplorerCourt(row),
          email: row.email,
          previousStatus: asSubmittedStatus(row.previous_status),
        }
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
        SET status = ${updated.previousStatus}
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
  const details = readDetails(row.details);
  const amenities = {
    lighting: triToBool(details.lighting),
    freeUse: triToBool(details.freeUse),
  };
  if (asSubmittedStatus(row.status) === "published") {
    return {
      id,
      source: "submitted",
      name: row.name,
      nameFi: row.name,
      status: details.status ?? "active",
      address: row.address,
      city: null,
      neighborhood: null,
      lat: row.lat,
      lon: row.lon,
      amenities,
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
    amenities,
    createdAt: toIso(row.created_at),
    emailConfirmed: asSubmittedStatus(row.status) === "pending",
  };
}

function toCourt(row: SubmittedRow): Court {
  const details = readDetails(row.details);
  const published = asSubmittedStatus(row.status) === "published";
  return {
    id: `submitted-${row.id}`,
    source: "submitted",
    name: row.name,
    nameFi: row.name,
    status: published ? (details.status ?? "active") : "pending",
    address: row.address,
    postalCode: null,
    city: null,
    neighborhood: null,
    lat: row.lat,
    lon: row.lon,
    comment: details.comment ?? null,
    website: details.website ?? null,
    constructionYear: details.constructionYear ?? null,
    owner: details.owner ?? null,
    admin: details.admin ?? null,
    amenities: {
      ...emptyAmenities(),
      lighting: triToBool(details.lighting),
      lightingInfo: details.lightingInfo ?? null,
      freeUse: triToBool(details.freeUse),
      schoolUse: triToBool(details.schoolUse),
      fieldType: details.fieldType ?? null,
      surfaceMaterial: details.surfaceMaterial ?? [],
      surfaceMaterialInfo: details.surfaceMaterialInfo ?? null,
      lengthM: details.lengthM ?? null,
      widthM: details.widthM ?? null,
      areaM2: details.areaM2 ?? null,
      toilet: triToBool(details.toilet),
      heightAdjustable: triToBool(details.heightAdjustable),
      hoopHeight: details.hoopHeight ?? null,
      waterPoint: details.waterPoint ?? null,
      matchClock: triToBool(details.matchClock),
      scoreboard: triToBool(details.scoreboard),
    },
    emailConfirmed: asSubmittedStatus(row.status) !== "unconfirmed",
    reportedStatus: details.status ?? null,
  };
}

const StoredDetailsSchema = SubmittedCourtSchema.pick({
  website: true,
  comment: true,
  constructionYear: true,
  owner: true,
  admin: true,
  lighting: true,
  lightingInfo: true,
  freeUse: true,
  schoolUse: true,
  fieldType: true,
  surfaceMaterial: true,
  surfaceMaterialInfo: true,
  lengthM: true,
  widthM: true,
  areaM2: true,
  toilet: true,
  heightAdjustable: true,
  hoopHeight: true,
  waterPoint: true,
  matchClock: true,
  scoreboard: true,
}).extend({
  status: z.enum(COURT_STATUS_CODES).nullable().optional(),
});

export async function updateSubmittedCourt(
  id: string,
  input: Omit<SubmittedCourtInput, "lat" | "lon">,
): Promise<{ ok: true } | { error: "unavailable" | "not-found" }> {
  const key = submittedCourtKey(id);
  if (!/^\d+$/.test(key)) return { error: "not-found" };
  const updated = await withDb(async (sql) => {
    const existing = await sql<SubmittedRow[]>`
      SELECT id, details
      FROM submitted_courts
      WHERE id = ${key}
      LIMIT 1
    `;
    const row = existing[0];
    if (!row) return { error: "not-found" as const };
    const previous = readDetails(row.details);
    const details = {
      ...storedDetails(input),
      constructionYear: previous.constructionYear ?? null,
      surfaceMaterialInfo: previous.surfaceMaterialInfo ?? null,
    };
    const rows = await sql<{ id: number | string }[]>`
      UPDATE submitted_courts
      SET
        name = ${input.name},
        address = ${input.address},
        email = ${input.email},
        details = ${sql.json(details)}
      WHERE id = ${key}
      RETURNING id
    `;
    return rows[0] ? { ok: true as const } : { error: "not-found" as const };
  });
  return updated ?? { error: "unavailable" };
}

function storedDetails(
  input: Omit<SubmittedCourtInput, "name" | "address" | "email" | "lat" | "lon">,
) {
  return {
    status: input.courtStatus ?? null,
    website: input.website ?? null,
    comment: input.comment ?? null,
    constructionYear: input.constructionYear ?? null,
    owner: input.owner ?? null,
    admin: input.admin ?? null,
    lighting: input.lighting ?? null,
    lightingInfo: input.lightingInfo ?? null,
    freeUse: input.freeUse ?? null,
    schoolUse: input.schoolUse ?? null,
    fieldType: input.fieldType ?? null,
    surfaceMaterial: input.surfaceMaterial ?? [],
    surfaceMaterialInfo: input.surfaceMaterialInfo ?? null,
    lengthM: input.lengthM ?? null,
    widthM: input.widthM ?? null,
    areaM2: input.areaM2 ?? null,
    toilet: input.toilet ?? null,
    heightAdjustable: input.heightAdjustable ?? null,
    hoopHeight: input.hoopHeight ?? null,
    waterPoint: input.waterPoint ?? null,
    matchClock: input.matchClock ?? null,
    scoreboard: input.scoreboard ?? null,
  };
}

function readDetails(value: unknown): z.infer<typeof StoredDetailsSchema> {
  const parsed = StoredDetailsSchema.safeParse(value ?? {});
  if (parsed.success) return parsed.data;
  return {
    website: null,
    comment: null,
    lightingInfo: null,
    surfaceMaterialInfo: null,
  };
}

function triToBool(value: "yes" | "no" | null | undefined): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function asSubmittedStatus(value: string): SubmittedStatus {
  if (value === "published" || value === "unconfirmed") return value;
  return "pending";
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
