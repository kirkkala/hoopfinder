import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getBasketballCourt } from "@/lib/catalog";
import { COURT_PHOTO_MAX_BYTES } from "@/lib/constants";
import {
  compressCourtImage,
  courtImageExtension,
  deleteCourtImage,
  readCourtImage,
  readCourtThumbnail,
  saveCourtImage,
  type CourtImageType,
} from "@/lib/court-image-store";
import { courtHref, courtPath, type Court } from "@/lib/courts";
import { getSubmittedCourt } from "@/lib/submitted-courts";
import { withDb } from "@/lib/db";

const MAX_PHOTOS = 12;

export type CourtPhoto = {
  id: string;
  url: string;
  thumbUrl: string;
  description: string | null;
};

export type CourtPhotoError =
  | "invalid"
  | "email"
  | "type"
  | "too-large"
  | "full"
  | "rate-limited"
  | "unavailable";

/** Lowercase, same form as a submitted court's email, so the two can be matched later. */
const photoEmail = z.string().trim().toLowerCase().pipe(z.email().max(254));
const photoDescription = z
  .string()
  .trim()
  .max(200)
  .transform((value) => value || null);

export function courtPhotoUrl(court: Pick<Court, "id" | "source">, photoId: string): string {
  return `${courtHref(court)}/photos/${photoId}`;
}

function courtPhoto(
  court: Pick<Court, "id" | "source">,
  row: { id: string; description: string | null },
): CourtPhoto {
  const url = courtPhotoUrl(court, row.id);
  return {
    id: row.id,
    url,
    thumbUrl: `${url}?thumb=1`,
    description: row.description,
  };
}

export type AdminCourtWithPhotos = {
  id: string;
  href: string | null;
  name: string;
  nameFi: string;
  neighborhood: string | null;
  city: string | null;
  photoCount: number;
};

/** Courts that have at least one photo, newest photo first. */
export async function listAdminCourtsWithPhotos(): Promise<AdminCourtWithPhotos[] | null> {
  const rows = await withDb((sql) => {
    return sql<{ court_id: string; photo_count: number | string }[]>`
      SELECT court_id, COUNT(*)::int AS photo_count
      FROM court_photos
      GROUP BY court_id
      ORDER BY MAX(created_at) DESC
    `;
  });
  if (!rows) return null;

  return Promise.all(
    rows.map(async (row) => {
      const court = await findCourt(row.court_id);
      return {
        id: row.court_id,
        href: court ? courtHref(court) : null,
        name: court?.name ?? row.court_id,
        nameFi: court?.nameFi ?? row.court_id,
        neighborhood: court?.neighborhood ?? null,
        city: court?.city ?? null,
        photoCount: Number(row.photo_count),
      };
    }),
  );
}

export async function listCourtPhotos(
  court: Pick<Court, "id" | "source">,
): Promise<CourtPhoto[]> {
  const rows = await withDb((sql) => {
    return sql<{ id: string; description: string | null }[]>`
      SELECT id, description
      FROM court_photos
      WHERE court_id = ${court.id}
      ORDER BY created_at ASC
    `;
  });
  return (rows ?? []).map((row) => courtPhoto(court, row));
}

export async function readPublishedCourtPhoto(
  id: string,
  kind: "full" | "thumb" = "full",
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await withDb((sql) => {
    return sql<{ court_id: string; content_type: string }[]>`
      SELECT court_id, content_type
      FROM court_photos
      WHERE id = ${id}
      LIMIT 1
    `;
  });
  const row = rows?.[0];
  if (!row) return null;
  const court = await findCourt(row.court_id);
  if (!court) return null;
  const bytes =
    kind === "thumb"
      ? await readCourtThumbnail(courtPath(court), id)
      : await readCourtImage(courtPath(court), id, row.content_type);
  if (!bytes) return null;
  return { bytes, contentType: kind === "thumb" ? "image/webp" : row.content_type };
}

const PHOTOS_PER_IP_PER_HOUR = 10;
const PHOTOS_PER_IP_PER_DAY = 25;
const PHOTOS_PER_DAY = 100;

/** Ten tries per address each hour, 25 each day, and 100 new photos for the whole site each day. */
export async function takeCourtPhotoSlot(ip: string): Promise<boolean | null> {
  return withDb(async (sql) => {
    await sql`
      DELETE FROM court_photo_limits
      WHERE created_at < NOW() - INTERVAL '1 day'
    `;
    const hour = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM court_photo_limits
      WHERE ip = ${ip} AND created_at > NOW() - INTERVAL '1 hour'
    `;
    const day = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM court_photo_limits
      WHERE ip = ${ip} AND created_at > NOW() - INTERVAL '1 day'
    `;
    const site = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM court_photos
      WHERE created_at > NOW() - INTERVAL '1 day'
    `;
    if (Number(hour[0]?.count ?? 0) >= PHOTOS_PER_IP_PER_HOUR) return false;
    if (Number(day[0]?.count ?? 0) >= PHOTOS_PER_IP_PER_DAY) return false;
    if (Number(site[0]?.count ?? 0) >= PHOTOS_PER_DAY) return false;
    await sql`INSERT INTO court_photo_limits (ip) VALUES (${ip})`;
    return true;
  });
}

export async function addCourtPhoto(
  courtId: string,
  file: File,
  email: string,
  description: string,
): Promise<{ photo: CourtPhoto } | { error: CourtPhotoError }> {
  const court = await findCourt(courtId);
  if (!court) return { error: "invalid" };
  const parsedEmail = photoEmail.safeParse(email);
  if (!parsedEmail.success) return { error: "email" };
  const parsedDescription = photoDescription.safeParse(description);
  if (!parsedDescription.success) return { error: "invalid" };
  const contentType = file.type;
  if (!courtImageExtension(contentType)) return { error: "type" };
  if (file.size <= 0 || file.size > COURT_PHOTO_MAX_BYTES) return { error: "too-large" };

  const existing = await listCourtPhotos(court);
  if (existing.length >= MAX_PHOTOS) return { error: "full" };

  const original = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageType(original, contentType as CourtImageType)) return { error: "type" };

  let stored: { bytes: Uint8Array; contentType: CourtImageType };
  try {
    stored = await compressCourtImage(original);
  } catch {
    return { error: "type" };
  }

  const id = randomUUID();
  try {
    await saveCourtImage(courtPath(court), id, stored.bytes, stored.contentType);
    const saved = await withDb((sql) => {
      return sql`
        INSERT INTO court_photos (id, court_id, content_type, email, description)
        VALUES (
          ${id},
          ${courtId},
          ${stored.contentType},
          ${parsedEmail.data},
          ${parsedDescription.data}
        )
      `;
    });
    if (!saved) return { error: "unavailable" };
  } catch (error) {
    console.error(error);
    return { error: "unavailable" };
  }

  return {
    photo: courtPhoto(court, { id, description: parsedDescription.data }),
  };
}

export async function deleteCourtPhoto(
  id: string,
): Promise<{ ok: true } | { error: "not-found" | "unavailable" }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "not-found" };
  const removed = await withDb((sql) => {
    return sql<{ court_id: string; content_type: string }[]>`
      DELETE FROM court_photos
      WHERE id = ${id}
      RETURNING court_id, content_type
    `;
  });
  if (!removed) return { error: "unavailable" };
  const row = removed[0];
  if (!row) return { error: "not-found" };
  const court = await findCourt(row.court_id);
  if (court) await deleteCourtImage(courtPath(court), id, row.content_type);
  return { ok: true };
}

async function findCourt(courtId: string): Promise<Court | null> {
  const catalog = await getBasketballCourt(courtId);
  if (catalog) return catalog.court;
  const submitted = await getSubmittedCourt(courtId);
  return submitted?.court ?? null;
}

function matchesImageType(bytes: Uint8Array, contentType: CourtImageType): boolean {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}
