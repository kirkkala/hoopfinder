# Hoop Finder

Find outdoor basketball courts across Finland. Helping basketballers to find courts to go out and play.

The first version is a map of outdoor basketball courts from LIPAS type **1310** and OpenStreetMap, with search, distance filtering, and a court detail page.

The UI defaults to Finnish, English is available. UI texts live in [`src/lib/copy.ts`](src/lib/copy.ts). The chosen language is stored in the browser. Court names come as LIPAS and OpenStreetMap provide them.

## What is in this MVP

- Interactive MapLibre map with the user’s location and clustered courts nationwide
- Search by name, address, city, or neighborhood
- Distance filter from your location after you share it
- Court page with the fields LIPAS or OpenStreetMap actually provide
- Server-side LIPAS and Overpass fetches (cached for a day, shared by all visitors)
- Last good court data is kept if a later fetch fails; the header shows when it was last fetched
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

Each court API is its own module. Pages only talk to the catalog:

- [`src/lib/sources/lipas.ts`](src/lib/sources/lipas.ts) — LIPAS type 1310
- [`src/lib/sources/osm.ts`](src/lib/sources/osm.ts) — OpenStreetMap Overpass
- [`src/lib/sources/index.ts`](src/lib/sources/index.ts) — source labels, attribution, listing links
- [`src/lib/catalog.ts`](src/lib/catalog.ts) — fetch every source, merge without duplicates, look up by id

To drop OpenStreetMap, remove it from `COURT_SOURCES` and `FETCHERS`, then delete `src/lib/sources/osm.ts`. To add a source, add a mapper module and one entry in those two lists. Earlier sources win when two courts are within 80 m.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` if you need to point `LIPAS_API_BASE` or `OVERPASS_API_BASE` at another host. Neither API needs a key. Overpass is a public shared API and often returns 504; the app then keeps the last good OpenStreetMap courts. Saved court data lives in `.hoopfinder-cache/` (gitignored) for a day so `next dev` does not refetch on every start. If a source has never succeeded, it is skipped until it does.

## License

Hoop Finder is licensed under the [GNU Affero General Public License v3.0](LICENSE).

You can use, study, and change the code. If you distribute it or run a modified version as a public service, you must share your source under the same license. The license covers this codebase, not the idea of finding basketball courts.

## Next sources (server-side keys only)

- Finnish Meteorological Institute — weather and playability
- Helsinki Linked Events — nearby basketball events
- Digitransit GraphQL — HSL routes
- OpenStreetMap + a routing service — cycling directions
