# Hoop Finder

Outdoor basketball courts across Finland — find a hoop, go out and play.

Map, search, and a page per court. UI defaults to Finnish; English is a toggle. Copy lives in [`src/lib/copy.ts`](src/lib/copy.ts).

## Data

Courts are the committed snapshot in [`data/courts.json`](data/courts.json). Runtime does not call the source APIs.

- [LIPAS](https://www.lipas.fi) type **1310** outdoor basketball sites
- [OpenStreetMap](https://www.openstreetmap.org/about) `leisure=pitch` + `sport=basketball`, via Overpass (three Finland tiles)
- [Nominatim](https://nominatim.org/) lookup fills missing OSM city, neighborhood, and street (most OSM pitches have no `addr:*` or a useful name)

LIPAS wins when an OSM pitch is within 80 m. Same-source neighbours are kept.

```bash
npm run refresh-courts              # LIPAS + OSM + Nominatim
npm run refresh-courts:lipas        # LIPAS only
npm run refresh-courts:osm-places   # Nominatim only, keep the OSM snapshot
```

A Monday GitHub Action runs the full refresh. If Overpass fails, the previous OSM snapshot is kept.

## Develop

```bash
npm install
docker compose up -d
cp .env.example .env.local   # if you do not already have one
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public map does not need API keys.

Postgres is only for visitor-submitted courts on `/add`. Copy `DATABASE_URL` from `.env.example` into `.env.local` if needed. The `submitted_courts` table is created on first request. Stop the database with `docker compose down`.

Dump the database `npm run dev` uses (`DATABASE_URL` in `.env.local`), not the Docker container:

```bash
pg_dump postgres://hoopfinder:hoopfinder@localhost:5432/hoopfinder > hoopfinder.sql
```

`docker compose exec … pg_dump` dumps Compose Postgres. If another Postgres is already on localhost:5432 (Homebrew, Postgres.app), the app writes there and the Compose dump is empty.

Restore with `psql postgres://hoopfinder:hoopfinder@localhost:5432/hoopfinder < hoopfinder.sql`.

## Suggest a court

Visitors open `/add`, drop a pin in Finland (not next to an existing court), and submit a name, address, and email. Other court facts are optional.

The pin shows on the map immediately. The visitor confirms by email, then an admin publishes it from `/admin`.
## Admin

`/admin` reviews visitor-submitted courts. Sign-in is with Google, NextAuth, a JWT session, and admin access from an environment variable.

Only `ADMIN_EMAILS` can access the admin panel.

Generate `AUTH_SECRET` with `npx auth secret`.

Set the same variables on Vercel. Production also needs `NEXTAUTH_URL=https://www.hoopfinder.fi`.

Transactional email uses [Resend](https://resend.com). Set `RESEND_API_KEY` and `EMAIL_FROM`.

## License

[GNU Affero General Public License v3.0](LICENSE).
