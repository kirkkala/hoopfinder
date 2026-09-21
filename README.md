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

Open [http://localhost:3000](http://localhost:3000). API keys are not required.

Postgres is only for visitor-submitted courts on `/add`. Copy `DATABASE_URL` from `.env.example` into `.env.local` if needed. The `submitted_courts` table is created on first request. Stop the database with `docker compose down`.

Dump the database `npm run dev` uses (`DATABASE_URL` in `.env.local`), not the Docker container:

```bash
pg_dump postgres://hoopfinder:hoopfinder@localhost:5432/hoopfinder > hoopfinder.sql
```

`docker compose exec … pg_dump` dumps Compose Postgres. If another Postgres is already on localhost:5432 (Homebrew, Postgres.app), the app writes there and the Compose dump is empty.

Restore with `psql postgres://hoopfinder:hoopfinder@localhost:5432/hoopfinder < hoopfinder.sql`.

## Suggest a court

Not every hoop is in LIPAS or OpenStreetMap. Visitors can open `/add`, drop a pin (not next to an existing court), send a name, address and email, and see it on the explore map as coming soon. After the court lands in a source snapshot (within about 80 m), the pending pin is hidden and the usual court page is shown. Email is stored for follow-up and is not shown on the map. No login in this first version.

## License

[GNU Affero General Public License v3.0](LICENSE).
