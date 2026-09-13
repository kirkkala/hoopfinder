# Hoop Finder

Find outdoor basketball courts across Finland. Helping basketballers to find courts to go out and play.

The first version is a map of outdoor basketball courts from LIPAS type **1310** and OpenStreetMap, with search and a court detail page.

The UI defaults to Finnish, English is available. UI texts live in [`src/lib/copy.ts`](src/lib/copy.ts). The chosen language is stored in the browser. Court names come as LIPAS and OpenStreetMap provide them.

## What is in this MVP

- Interactive MapLibre map with the user’s location and clustered courts nationwide
- Search a city, neighborhood, or address, or zoom the map to your location
- Court page with the fields LIPAS or OpenStreetMap actually provide
- Court list shipped in [`data/courts.json`](data/courts.json); the header shows when that snapshot was fetched
- Error, empty, and not-found states

Weather, Linked Events, route finder, and cycling directions might come later. Or any other good feasible idea.

## LIPAS schema notes

Checked against `GET /v2/sports-site-categories` and live `1310` payloads:

- Lighting exists as `ligthing?` (API spelling) and is optional — only about 40% of courts report it
- There is **no hoop-count field**. `basketball-field-type` is free-text Finnish (full court, mini court, one-basket, streetball, …)
- Other optional properties: surface, dimensions, free use, school use, toilet, adjustable height, water point, scoreboard, match clock

The app never invents values for missing fields.

OpenStreetMap pitches tagged `leisure=pitch` and `sport=basketball` are merged in when they are more than 80 m from a LIPAS court.

## Data sources

Each court API is its own module. Pages only talk to the catalog, which reads the committed snapshot:

- [`data/courts.json`](data/courts.json) — last successful LIPAS + Overpass dump
- [`src/lib/catalog.ts`](src/lib/catalog.ts) — load the snapshot, merge without duplicates, look up by id
- [`src/lib/sources/lipas.ts`](src/lib/sources/lipas.ts) — LIPAS type 1310
- [`src/lib/sources/osm.ts`](src/lib/sources/osm.ts) — OpenStreetMap Overpass
- [`src/lib/sources/index.ts`](src/lib/sources/index.ts) — source labels, attribution, listing links

Overpass is too slow and unreliable to call from Vercel on each request, so production never fetches courts live. A GitHub Action runs `npm run refresh-courts` every Monday, commits [`data/courts.json`](data/courts.json) if it changed, and Vercel deploys that. You can also run the same job from the Actions tab, or locally:

```bash
npm run refresh-courts
```

If Overpass is down, the script keeps the previous OSM courts and still updates LIPAS. The header “data updated” date comes from the snapshot.

To drop OpenStreetMap, remove it from `COURT_SOURCES`, then delete `src/lib/sources/osm.ts`. To add a source, add a mapper module, one entry in `COURT_SOURCES`, and include it in `npm run refresh-courts`. Earlier sources win when two courts are within 80 m.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If needed, copy `.env.example` and update API URLs. API keys are not required.

## License

Hoop Finder is licensed under the [GNU Affero General Public License v3.0](LICENSE).
