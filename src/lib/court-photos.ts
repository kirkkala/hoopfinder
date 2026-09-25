import { randomUUID } from "node:crypto";
import { getBasketballCourt } from "@/lib/catalog";
import {
  compressCourtImage,
  courtImageExtension,
  readCourtImage,
  saveCourtImage,
  type CourtImageType,
} from "@/lib/court-image-store";
import { courtHref, courtPath, type Court } from "@/lib/courts";
import { getSubmittedCourt } from "@/lib/submitted-courts";
import { withDb } from "@/lib/db";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS = 12;

export type CourtPhoto = {
  id: string;
  url: string;
};

export type CourtPhotoError = "invalid" | "type" | "too-large" | "full" | "unavailable";

export function courtPhotoUrl(court: Pick<Court, "id" | "source">, photoId: string): string {
  return `${courtHref(court)}/photos/${photoId}`;
}

export async function listCourtPhotos(
  court: Pick<Court, "id" | "source">,
): Promise<CourtPhoto[]> {
  const rows = await withDb((sql) => {
    return sql<{ id: string }[]>`
      SELECT id
      FROM court_photos
      WHERE court_id = ${court.id}
      ORDER BY created_at ASC
    `;
  });
  return (rows ?? []).map((row) => ({
    id: row.id,
    url: courtPhotoUrl(court, row.id),
  }));
}

export async function readPublishedCourtPhoto(
  id: string,
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
  const bytes = await readCourtImage(courtPath(court), id, row.content_type);
  if (!bytes) return null;
  return { bytes, contentType: row.content_type };
}

export async function addCourtPhoto(
  courtId: string,
  file: File,
): Promise<{ photo: CourtPhoto } | { error: CourtPhotoError }> {
  const court = await findCourt(courtId);
  if (!court) return { error: "invalid" };
  const contentType = file.type;
  if (!courtImageExtension(contentType)) return { error: "type" };
  if (file.size <= 0 || file.size > MAX_BYTES) return { error: "too-large" };

  const original = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageType(original, contentType as CourtImageType)) return { error: "type" };

  const existing = await listCourtPhotos(court);
  if (existing.length >= MAX_PHOTOS) return { error: "full" };

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
        INSERT INTO court_photos (id, court_id, content_type)
        VALUES (${id}, ${courtId}, ${stored.contentType})
      `;
    });
    if (!saved) return { error: "unavailable" };
  } catch (error) {
    console.error(error);
    return { error: "unavailable" };
  }

  return { photo: { id, url: courtPhotoUrl(court, id) } };
}

async function findCourt(courtId: string): Promise<Pick<Court, "id" | "source"> | null> {
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
