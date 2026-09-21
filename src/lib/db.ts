import postgres from "postgres";

type Sql = postgres.Sql;

const SCHEMA_VERSION = 7;

const globalForDb = globalThis as typeof globalThis & {
  __hoopfinderSql?: Sql;
  __hoopfinderSchema?: Promise<void>;
  __hoopfinderSchemaVersion?: number;
};

export function getSql(): Sql | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!globalForDb.__hoopfinderSql) {
    globalForDb.__hoopfinderSql = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return globalForDb.__hoopfinderSql;
}

export async function withDb<T>(
  fn: (sql: Sql) => Promise<T>,
): Promise<T | null> {
  const sql = getSql();
  if (!sql) return null;
  if (
    !globalForDb.__hoopfinderSchema ||
    globalForDb.__hoopfinderSchemaVersion !== SCHEMA_VERSION
  ) {
    globalForDb.__hoopfinderSchemaVersion = SCHEMA_VERSION;
    globalForDb.__hoopfinderSchema = ensureSchema(sql).catch((error) => {
      globalForDb.__hoopfinderSchema = undefined;
      globalForDb.__hoopfinderSchemaVersion = undefined;
      throw error;
    });
  }
  await globalForDb.__hoopfinderSchema;
  return fn(sql);
}

async function ensureSchema(sql: Sql) {
  await sql`DROP TABLE IF EXISTS pending_courts`;
  await sql`
    CREATE TABLE IF NOT EXISTS submitted_courts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE submitted_courts
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  `;
  await sql`
    UPDATE submitted_courts
    SET status = 'published'
    WHERE status = 'approved'
  `;
  await sql`CREATE SEQUENCE IF NOT EXISTS submitted_court_id_seq START WITH 10000`;
  const legacy = await sql<{ id: string }[]>`
    SELECT id
    FROM submitted_courts
    WHERE id !~ '^submitted-[0-9]+$'
    ORDER BY created_at ASC, id ASC
  `;
  for (const row of legacy) {
    const [seq] = await sql<{ n: string }[]>`
      SELECT nextval('submitted_court_id_seq')::text AS n
    `;
    if (!seq) throw new Error("submitted court sequence returned no value");
    await sql`
      UPDATE submitted_courts
      SET id = ${`submitted-${seq.n}`}
      WHERE id = ${row.id}
    `;
  }
  await sql`
    SELECT setval(
      'submitted_court_id_seq',
      GREATEST(
        9999,
        COALESCE(
          (
            SELECT MAX(substring(id from '^submitted-([0-9]+)$')::int)
            FROM submitted_courts
            WHERE id ~ '^submitted-[0-9]+$'
          ),
          9999
        )
      )
    )
  `;
}
