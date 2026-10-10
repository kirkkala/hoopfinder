import { withDb } from "@/lib/db";
import { type AdminFeedback, FEEDBACK_PER_HOUR } from "@/lib/feedback";

type FeedbackRow = {
  id: number | string;
  title: string;
  body: string;
  email: string | null;
  notes: string;
  created_at: Date | string;
};

export function feedbackClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

export async function takeFeedbackSlot(ip: string): Promise<boolean | null> {
  return withDb(async (sql) => {
    await sql`
      DELETE FROM feedback_limits
      WHERE created_at < NOW() - INTERVAL '1 day'
    `;
    const rows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM feedback_limits
      WHERE ip = ${ip} AND created_at > NOW() - INTERVAL '1 hour'
    `;
    if (Number(rows[0]?.count ?? 0) >= FEEDBACK_PER_HOUR) return false;
    await sql`INSERT INTO feedback_limits (ip) VALUES (${ip})`;
    return true;
  });
}

export async function createFeedback(input: {
  title: string;
  body: string;
  email: string | null;
}): Promise<{ ok: true } | { error: "unavailable" }> {
  const created = await withDb(async (sql) => {
    await sql`
      INSERT INTO feedback (title, body, email)
      VALUES (${input.title}, ${input.body}, ${input.email})
    `;
    return true;
  });
  if (!created) return { error: "unavailable" };
  return { ok: true };
}

export async function listAdminFeedback(): Promise<AdminFeedback[] | null> {
  const rows = await withDb((sql) => {
    return sql<FeedbackRow[]>`
      SELECT id, title, body, email, notes, created_at
      FROM feedback
      ORDER BY created_at DESC, id DESC
    `;
  });
  if (!rows) return null;
  return rows.map(toAdminFeedback);
}

export async function updateFeedbackNotes(
  id: string,
  notes: string,
): Promise<{ ok: true } | { error: "not-found" | "unavailable" }> {
  if (!/^\d+$/.test(id)) return { error: "not-found" };
  const rows = await withDb((sql) => {
    return sql<{ id: number }[]>`
      UPDATE feedback
      SET notes = ${notes}
      WHERE id = ${Number(id)}
      RETURNING id
    `;
  });
  if (!rows) return { error: "unavailable" };
  if (rows.length === 0) return { error: "not-found" };
  return { ok: true };
}

function toAdminFeedback(row: FeedbackRow): AdminFeedback {
  return {
    id: String(row.id),
    title: row.title,
    body: row.body,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}
