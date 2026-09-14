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

## Data sources

The app never fetches courts at request time. It reads the committed snapshot in [`data/courts.json`](data/courts.json); the header shows when that dump was fetched.

Refresh with `npm run refresh-courts` or the Monday GitHub Action:

- LIPAS type **1310** outdoor basketball sites
- OpenStreetMap `leisure=pitch` + `sport=basketball`, via Overpass (three Finland tiles, then clipped to Finland). The public Overpass dispatcher often 504s on a nationwide query.

LIPAS wins when an OSM pitch is within 80 m. Two courts from the same source are kept even if they sit next to each other. If Overpass fails, the previous OSM snapshot is kept and LIPAS can still update.

Modules: [`src/lib/catalog.ts`](src/lib/catalog.ts), [`src/lib/sources/lipas.ts`](src/lib/sources/lipas.ts), [`src/lib/sources/osm.ts`](src/lib/sources/osm.ts).

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If needed, copy `.env.example` and update API URLs. API keys are not required.

## License

Hoop Finder is licensed under the [GNU Affero General Public License v3.0](LICENSE).
