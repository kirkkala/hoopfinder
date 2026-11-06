import { randomBytes } from "node:crypto";
import { cache } from "react";
import { z } from "zod";
import { adminEmails } from "@/lib/admin";
import { getCourtCatalog } from "@/lib/catalog";
import { courtPageCount } from "@/lib/court-groups";
import {
  ADMIN_CODES,
  applyVisitorCourt,
  COURT_MATCH_KM,
  COURT_STATUS_CODES,
  type Court,
  courtHref,
  courtPlacementBlocked,
  type ExplorerCourt,
  emptyAmenities,
  FIELD_TYPE_CODES,
  HOOP_HEIGHT_CODES,
  isTooCloseToCourt,
  OWNER_CODES,
  SURFACE_CODES,
  submittedCourtKey,
  WATER_POINT_CODES,
} from "@/lib/courts";
import { withDb } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/email";
import { type Coordinates, haversineKm } from "@/lib/geo";
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
  greeting: optionalText(1000),
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
  greeting: string | null;
  /** Set when this row corrects an existing court instead of adding one. */
  editOf: string | null;
  /** Facts this correction changes. Empty for a new court. */
  changes: CourtEditChanges | null;
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
    .filter((row) => !readDetails(row.details).editOf && !isTooCloseToCourt(row, courts))
    .map(toExplorerCourt);
}

/** Court pages, plus submitted courts that are not already covered by one. */
export const countPublicCourts = cache(async (): Promise<number> => {
  const { courts } = await getCourtCatalog();
  const pages = courtPageCount(courts);
  try {
    const submitted = await listSubmittedCourts();
    return pages + submitted.length;
  } catch (error) {
    console.error(error);
    return pages;
  }
});

export async function listAdminSubmittedCourts(): Promise<AdminSubmittedCourt[] | null> {
  const rows = await withDb((sql) => {
    return sql<AdminRow[]>`
      SELECT id, name, address, email, lat, lon, status, created_at, details
      FROM submitted_courts
      ORDER BY created_at DESC
    `;
  });
  if (!rows) return null;
  return rows.map((row) => {
    const details = readDetails(row.details);
    const editOf = details.editOf ?? null;
    return {
      id: String(row.id),
      name: row.name,
      address: row.address,
      email: row.email,
      lat: row.lat,
      lon: row.lon,
      status: asSubmittedStatus(row.status),
      createdAt: toIso(row.created_at),
      greeting: details.greeting ?? null,
      editOf,
      changes: editOf ? storedEditChanges(row.details) : null,
      court: toCourt(row),
    };
  });
}

/** Published submissions within 80 m of a place. The catalog page shows their facts. */
export async function listPublishedCourtsNear(points: Coordinates[]): Promise<Court[]> {
  const rows = await withDb((sql) => {
    return sql<AdminRow[]>`
      SELECT id, name, address, email, lat, lon, status, created_at, details
      FROM submitted_courts
      WHERE status = 'published'
        AND COALESCE(details->>'editOf', '') = ''
    `;
  });
  if (!rows) return [];
  return rows
    .filter((row) => !readDetails(row.details).editOf)
    .map(toCourt)
    .filter((court) => points.some((point) => haversineKm(point, court) < COURT_MATCH_KM))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getSubmittedCourt(id: string): Promise<{
  court: Court;
  createdAt: string;
  email: string;
  status: SubmittedStatus;
  editOf: string | null;
} | null> {
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
  return {
    court: toCourt(row),
    createdAt: toIso(row.created_at),
    email: row.email,
    status: asSubmittedStatus(row.status),
    editOf: readDetails(row.details).editOf ?? null,
  };
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
): Promise<{ court: ExplorerCourt } | { error: "unavailable" | "not-found" | "email" }> {
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
        court.status, court.created_at, court.details, previous.status AS previous_status
    `;
    const row = rows[0];
    if (!row) return { error: "not-found" as const };
    const raw =
      row.details && typeof row.details === "object"
        ? (row.details as Record<string, unknown>)
        : {};
    const editOf = typeof raw.editOf === "string" ? raw.editOf : null;
    const target = editOf?.startsWith("submitted-") ? submittedCourtKey(editOf) : null;
    if (status === "published" && editOf) {
      await sql`
        UPDATE submitted_courts
        SET details = COALESCE(details, '{}'::jsonb) || ${sql.json({ publishedAt: new Date().toISOString() })}
        WHERE id = ${key}
      `;
    }
    if (status === "published" && target && /^\d+$/.test(target)) {
      const patch = { ...raw };
      delete patch.editOf;
      delete patch.publishedAt;
      const name = typeof patch.name === "string" && patch.name.trim() ? patch.name.trim() : null;
      const address = typeof patch.address === "string" ? patch.address.trim() : null;
      delete patch.name;
      delete patch.address;
      await sql`
        UPDATE submitted_courts
        SET
          name = CASE WHEN ${name}::text IS NULL THEN name ELSE ${name} END,
          address = CASE WHEN ${address}::text IS NULL THEN address ELSE ${address} END,
          details = COALESCE(details, '{}'::jsonb) || ${sql.json(jsonValue(patch))}
        WHERE id = ${target}
      `;
    }
    return {
      court: toExplorerCourt(row),
      email: row.email,
      previousStatus: asSubmittedStatus(row.previous_status),
      editOf,
    };
  });

  if (!updated) return { error: "unavailable" };
  if ("error" in updated) return updated;
  if (status !== "published" || updated.editOf) return { court: updated.court };

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

export type CourtEditChanges = {
  name?: string;
  address?: string;
  status?: (typeof COURT_STATUS_CODES)[number];
  website?: string | null;
  comment?: string | null;
  owner?: string | null;
  admin?: string | null;
  lighting?: "yes" | "no" | null;
  lightingInfo?: string | null;
  freeUse?: "yes" | "no" | null;
  schoolUse?: "yes" | "no" | null;
  fieldType?: string | null;
  surfaceMaterial?: string[];
  lengthM?: number | null;
  widthM?: number | null;
  areaM2?: number | null;
  toilet?: "yes" | "no" | null;
  heightAdjustable?: "yes" | "no" | null;
  hoopHeight?: "official" | "lower" | null;
  waterPoint?: string | null;
  matchClock?: "yes" | "no" | null;
  scoreboard?: "yes" | "no" | null;
};

/** The facts stored on a correction row, without the bookkeeping keys. */
export function storedEditChanges(details: unknown): CourtEditChanges {
  if (!details || typeof details !== "object") return {};
  const value = details as Record<string, unknown>;
  const changes: CourtEditChanges = {};
  if (typeof value.name === "string" && value.name.trim()) changes.name = value.name.trim();
  if (typeof value.address === "string") changes.address = value.address.trim();
  if ("status" in value) {
    const status = COURT_STATUS_CODES.find((item) => item === value.status);
    if (status) changes.status = status;
  }
  if ("website" in value) changes.website = textOrNull(value.website);
  if ("comment" in value) changes.comment = textOrNull(value.comment);
  if ("owner" in value) changes.owner = code(OWNER_CODES, value.owner) || null;
  if ("admin" in value) changes.admin = code(ADMIN_CODES, value.admin) || null;
  if ("lightingInfo" in value) changes.lightingInfo = textOrNull(value.lightingInfo);
  if ("fieldType" in value) changes.fieldType = code(FIELD_TYPE_CODES, value.fieldType) || null;
  if ("waterPoint" in value) changes.waterPoint = code(WATER_POINT_CODES, value.waterPoint) || null;
  for (const key of [
    "lighting",
    "freeUse",
    "schoolUse",
    "toilet",
    "heightAdjustable",
    "matchClock",
    "scoreboard",
  ] as const) {
    if (!(key in value)) continue;
    changes[key] = value[key] === "yes" || value[key] === "no" ? value[key] : null;
  }
  if ("hoopHeight" in value) changes.hoopHeight = code(HOOP_HEIGHT_CODES, value.hoopHeight) || null;
  if ("surfaceMaterial" in value) {
    changes.surfaceMaterial = stringList(value.surfaceMaterial).filter((item) =>
      SURFACE_CODES.some((entry) => entry === item),
    );
  }
  if ("lengthM" in value) changes.lengthM = measureOrNull(value.lengthM);
  if ("widthM" in value) changes.widthM = measureOrNull(value.widthM);
  if ("areaM2" in value) changes.areaM2 = measureOrNull(value.areaM2);
  return changes;
}

export type CourtEditDraft = {
  name?: string;
  address?: string;
  /** Full form snapshot for a visitor court. Catalog courts only read hoop height. */
  details?: Record<string, unknown> | null;
};

/** Fields that differ from the court as it is published now. Empty when nothing changed. */
export function courtEditChanges(court: Court, draft: CourtEditDraft): CourtEditChanges | null {
  const details = draft.details ?? {};
  if (court.source !== "submitted") {
    if (!Object.hasOwn(details, "hoopHeight")) return null;
    const next = code(HOOP_HEIGHT_CODES, details.hoopHeight);
    const current = court.amenities.hoopHeight ?? "";
    if (next === current) return null;
    return { hoopHeight: next || null };
  }

  const changes: CourtEditChanges = {};
  const name = draft.name?.trim() ?? "";
  if (name && name !== court.name.trim() && name !== court.nameFi.trim()) changes.name = name;
  const address = draft.address?.trim() ?? "";
  if (draft.address !== undefined && address !== (court.address ?? "").trim()) {
    changes.address = address;
  }

  if (Object.hasOwn(details, "courtStatus")) {
    const status = code(COURT_STATUS_CODES, details.courtStatus);
    const currentStatus =
      code(COURT_STATUS_CODES, court.status) || code(COURT_STATUS_CODES, court.reportedStatus);
    if (status && status !== currentStatus) changes.status = status;
  }

  if (Object.hasOwn(details, "website"))
    putText(changes, "website", details.website, court.website);
  if (Object.hasOwn(details, "comment"))
    putText(changes, "comment", details.comment, court.comment);
  if (Object.hasOwn(details, "owner")) {
    putText(changes, "owner", code(OWNER_CODES, details.owner), court.owner);
  }
  if (Object.hasOwn(details, "admin")) {
    putText(changes, "admin", code(ADMIN_CODES, details.admin), court.admin);
  }
  if (Object.hasOwn(details, "lightingInfo")) {
    putText(changes, "lightingInfo", details.lightingInfo, court.amenities.lightingInfo);
  }
  if (Object.hasOwn(details, "fieldType")) {
    putText(
      changes,
      "fieldType",
      code(FIELD_TYPE_CODES, details.fieldType),
      court.amenities.fieldType,
    );
  }
  if (Object.hasOwn(details, "waterPoint")) {
    putText(
      changes,
      "waterPoint",
      code(WATER_POINT_CODES, details.waterPoint),
      court.amenities.waterPoint,
    );
  }
  if (Object.hasOwn(details, "lighting"))
    putTri(changes, "lighting", details.lighting, court.amenities.lighting);
  if (Object.hasOwn(details, "freeUse"))
    putTri(changes, "freeUse", details.freeUse, court.amenities.freeUse);
  if (Object.hasOwn(details, "schoolUse"))
    putTri(changes, "schoolUse", details.schoolUse, court.amenities.schoolUse);
  if (Object.hasOwn(details, "toilet"))
    putTri(changes, "toilet", details.toilet, court.amenities.toilet);
  if (Object.hasOwn(details, "heightAdjustable")) {
    putTri(changes, "heightAdjustable", details.heightAdjustable, court.amenities.heightAdjustable);
  }
  if (Object.hasOwn(details, "matchClock")) {
    putTri(changes, "matchClock", details.matchClock, court.amenities.matchClock);
  }
  if (Object.hasOwn(details, "scoreboard")) {
    putTri(changes, "scoreboard", details.scoreboard, court.amenities.scoreboard);
  }
  if (Object.hasOwn(details, "hoopHeight")) {
    const hoop = code(HOOP_HEIGHT_CODES, details.hoopHeight);
    if (hoop !== (court.amenities.hoopHeight ?? "")) changes.hoopHeight = hoop || null;
  }
  if (Object.hasOwn(details, "surfaceMaterial")) {
    const surface = Array.isArray(details.surfaceMaterial)
      ? details.surfaceMaterial.filter((item): item is string =>
          SURFACE_CODES.some((entry) => entry === item),
        )
      : [];
    if (surface.join() !== court.amenities.surfaceMaterial.join())
      changes.surfaceMaterial = surface;
  }
  if (Object.hasOwn(details, "lengthM"))
    putMeasure(changes, "lengthM", details.lengthM, court.amenities.lengthM);
  if (Object.hasOwn(details, "widthM"))
    putMeasure(changes, "widthM", details.widthM, court.amenities.widthM);
  if (Object.hasOwn(details, "areaM2"))
    putMeasure(changes, "areaM2", details.areaM2, court.amenities.areaM2);

  return Object.keys(changes).length > 0 ? changes : null;
}

export type PendingCourtEdit = {
  id: string;
  email: string;
  status: "unconfirmed" | "pending";
  changes: CourtEditChanges;
};

/** Corrections an admin can publish. The visitor may not have opened the email yet. */
export async function listPendingEdits(courtId: string): Promise<PendingCourtEdit[]> {
  const rows = await withDb((sql) => {
    return sql<{ id: number | string; email: string; status: string; details: unknown }[]>`
      SELECT id, email, status, details
      FROM submitted_courts
      WHERE status IN ('unconfirmed', 'pending') AND details->>'editOf' = ${courtId}
      ORDER BY created_at
    `;
  });
  if (!rows) return [];
  return rows.map((row) => ({
    id: String(row.id),
    email: row.email,
    status: row.status === "unconfirmed" ? "unconfirmed" : "pending",
    changes: storedEditChanges(row.details),
  }));
}

/** Published corrections for one court, oldest publish first so a later publish wins. */
export async function listPublishedEdits(
  courtId: string,
): Promise<{ publishedAt: string; details: unknown }[]> {
  const rows = await withDb((sql) => {
    return sql<{ id: number | string; created_at: Date | string; details: unknown }[]>`
      SELECT id, created_at, details
      FROM submitted_courts
      WHERE status = 'published' AND details->>'editOf' = ${courtId}
    `;
  });
  if (!rows) return [];
  return rows
    .map((row) => ({
      publishedAt: readDetails(row.details).publishedAt || toIso(row.created_at),
      details: row.details,
    }))
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
}

/** Catalog facts, then nearby published submissions, then corrections in publish order. */
export async function courtAsPublished(court: Court): Promise<Court> {
  let current = court;
  if (court.source !== "submitted") {
    const visitors = await listPublishedCourtsNear(court.members ?? [court]);
    current = visitors.reduce((item, visitor) => applyVisitorCourt(item, visitor), court);
  }
  const edits = await listPublishedEdits(court.id);
  return edits.reduce((item, edit) => applyCourtEdit(item, edit.details), current);
}

export function applyCourtEdit(court: Court, details: unknown): Court {
  if (!details || typeof details !== "object") return court;
  const value = details as Record<string, unknown>;
  const name = typeof value.name === "string" && value.name.trim() ? value.name.trim() : null;
  const status =
    typeof value.status === "string"
      ? COURT_STATUS_CODES.find((code) => code === value.status)
      : undefined;
  const { amenities } = court;
  return {
    ...court,
    name: name ?? court.name,
    nameFi: name ?? court.nameFi,
    address: "address" in value ? textOrNull(value.address) : court.address,
    comment: "comment" in value ? textOrNull(value.comment) : court.comment,
    website: "website" in value ? textOrNull(value.website) : court.website,
    owner: "owner" in value ? textOrNull(value.owner) : court.owner,
    admin: "admin" in value ? textOrNull(value.admin) : court.admin,
    status: status ?? court.status,
    amenities: {
      ...amenities,
      lighting:
        "lighting" in value ? triToBool(value.lighting as "yes" | "no" | null) : amenities.lighting,
      lightingInfo:
        "lightingInfo" in value ? textOrNull(value.lightingInfo) : amenities.lightingInfo,
      freeUse:
        "freeUse" in value ? triToBool(value.freeUse as "yes" | "no" | null) : amenities.freeUse,
      schoolUse:
        "schoolUse" in value
          ? triToBool(value.schoolUse as "yes" | "no" | null)
          : amenities.schoolUse,
      fieldType: "fieldType" in value ? textOrNull(value.fieldType) : amenities.fieldType,
      surfaceMaterial:
        "surfaceMaterial" in value ? stringList(value.surfaceMaterial) : amenities.surfaceMaterial,
      lengthM: "lengthM" in value ? measureOrNull(value.lengthM) : amenities.lengthM,
      widthM: "widthM" in value ? measureOrNull(value.widthM) : amenities.widthM,
      areaM2: "areaM2" in value ? measureOrNull(value.areaM2) : amenities.areaM2,
      toilet: "toilet" in value ? triToBool(value.toilet as "yes" | "no" | null) : amenities.toilet,
      heightAdjustable:
        "heightAdjustable" in value
          ? triToBool(value.heightAdjustable as "yes" | "no" | null)
          : amenities.heightAdjustable,
      hoopHeight:
        "hoopHeight" in value
          ? code(HOOP_HEIGHT_CODES, value.hoopHeight) || null
          : amenities.hoopHeight,
      waterPoint: "waterPoint" in value ? textOrNull(value.waterPoint) : amenities.waterPoint,
      matchClock:
        "matchClock" in value
          ? triToBool(value.matchClock as "yes" | "no" | null)
          : amenities.matchClock,
      scoreboard:
        "scoreboard" in value
          ? triToBool(value.scoreboard as "yes" | "no" | null)
          : amenities.scoreboard,
    },
  };
}

export async function createCourtEdit(
  court: Court,
  email: string,
  changes: CourtEditChanges,
  origin: string,
  options?: { publish?: boolean },
): Promise<{ ok: true } | { error: "unavailable" | "email" }> {
  const token = randomBytes(32).toString("base64url");
  const details = { ...changes, editOf: court.id };
  if (options?.publish) {
    const saved = await withDb(async (sql) => {
      const rows = await sql<{ id: number | string }[]>`
        INSERT INTO submitted_courts (
          name, address, email, lat, lon, status, details
        )
        VALUES (
          ${changes.name?.trim() || court.name.trim() || court.nameFi.trim() || "Court"},
          ${changes.address ?? (court.address?.trim() || "—")},
          ${email},
          ${court.lat},
          ${court.lon},
          'pending',
          ${sql.json(details)}
        )
        RETURNING id
      `;
      return rows[0] ? { id: String(rows[0].id) } : { error: "unavailable" as const };
    });
    if (!saved || "error" in saved) return { error: "unavailable" };
    const published = await setSubmittedCourtStatus(saved.id, "published", origin);
    return "error" in published ? { error: "unavailable" } : { ok: true };
  }
  const name = changes.name?.trim() || court.name.trim() || court.nameFi.trim() || "Court";
  const address = changes.address ?? (court.address?.trim() || "—");
  const mailName = court.name.trim() || court.nameFi.trim() || name;
  const saved = await withDb(async (sql) => {
    const existing = await sql<
      { id: number | string; confirmation_token: string | null; details: unknown }[]
    >`
      SELECT id, confirmation_token, details
      FROM submitted_courts
      WHERE status = 'unconfirmed'
        AND email = ${email}
        AND details->>'editOf' = ${court.id}
      LIMIT 1
    `;
    const previous = existing[0];
    if (previous) {
      const rows = await sql<{ id: number | string }[]>`
        UPDATE submitted_courts
        SET
          name = ${name},
          address = ${address},
          lat = ${court.lat},
          lon = ${court.lon},
          confirmation_token = ${token},
          details = ${sql.json(details)}
        WHERE id = ${previous.id} AND status = 'unconfirmed'
        RETURNING id
      `;
      return rows[0]
        ? { id: String(previous.id), replaced: previous }
        : { error: "unavailable" as const };
    }

    const rows = await sql<{ id: number | string }[]>`
      INSERT INTO submitted_courts (
        name, address, email, lat, lon, status, confirmation_token, details
      )
      VALUES (
        ${name},
        ${address},
        ${email},
        ${court.lat},
        ${court.lon},
        'unconfirmed',
        ${token},
        ${sql.json(details)}
      )
      RETURNING id
    `;
    return rows[0] ? { id: String(rows[0].id), replaced: null } : { error: "unavailable" as const };
  });

  if (!saved || "error" in saved) return { error: "unavailable" };

  const sent = await sendTemplateEmail({
    to: email,
    template: "hoop-edit-confirmation-link",
    variables: {
      COURT_NAME: mailName,
      COURT_EDIT_CONFIRMATION_LINK: `${origin}/edit/confirm/${token}`,
    },
  });
  if (!("error" in sent)) return { ok: true };

  await withDb(async (sql) => {
    if (saved.replaced) {
      await sql`
        UPDATE submitted_courts
        SET
          confirmation_token = ${saved.replaced.confirmation_token},
          details = ${sql.json(jsonValue(saved.replaced.details))}
        WHERE id = ${saved.id} AND status = 'unconfirmed'
      `;
      return;
    }
    await sql`
      DELETE FROM submitted_courts
      WHERE id = ${saved.id} AND status = 'unconfirmed'
    `;
  });
  return { error: "email" };
}

function jsonValue(value: unknown) {
  return value as never;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function code<T extends string>(codes: readonly T[], value: unknown): T | "" {
  return typeof value === "string" && codes.some((entry) => entry === value) ? (value as T) : "";
}

function putText(
  changes: CourtEditChanges,
  key: "website" | "comment" | "owner" | "admin" | "lightingInfo" | "fieldType" | "waterPoint",
  value: unknown,
  current: string | null,
) {
  const next = typeof value === "string" ? value.trim() : "";
  if (next === (current ?? "").trim()) return;
  changes[key] = next || null;
}

function putTri(
  changes: CourtEditChanges,
  key:
    | "lighting"
    | "freeUse"
    | "schoolUse"
    | "toilet"
    | "heightAdjustable"
    | "matchClock"
    | "scoreboard",
  value: unknown,
  current: boolean | null,
) {
  const next = value === "yes" || value === "no" ? value : "";
  const previous = current === true ? "yes" : current === false ? "no" : "";
  if (next === previous) return;
  changes[key] = next || null;
}

function putMeasure(
  changes: CourtEditChanges,
  key: "lengthM" | "widthM" | "areaM2",
  value: unknown,
  current: number | null,
) {
  const next = typeof value === "number" && Number.isFinite(value) ? value : null;
  if (next === current) return;
  changes[key] = next;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function measureOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
  greeting: true,
}).extend({
  status: z.enum(COURT_STATUS_CODES).nullable().optional(),
  editOf: z.string().trim().min(1).max(80).nullable().optional(),
  publishedAt: z.string().nullable().optional(),
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
      greeting: input.greeting ?? previous.greeting ?? null,
      editOf: previous.editOf ?? null,
      publishedAt: previous.publishedAt ?? null,
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
    greeting: input.greeting ?? null,
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
    greeting: null,
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
