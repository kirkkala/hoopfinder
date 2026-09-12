# Hoop Finder

Find outdoor basketball courts across Finland. Built for junior players.

The first version is a map of LIPAS type **1310 (Basketball court)** with search, distance filtering, and a court detail page.

The UI is English for now. Localization is added once the product shape is stable.

## What is in this MVP

- Interactive MapLibre map with the user’s location and clustered courts nationwide
- Search by name, address, city, or neighborhood
- Distance filter from your location after you share it
- Court page with the fields LIPAS actually provides
- Server-side LIPAS fetch (cached for an hour)
- Error, empty, and not-found states

Weather, Linked Events, route finder, and cycling directions might come later. Or any other good feasible idea.

## LIPAS schema notes

Checked against `GET /v2/sports-site-categories` and live `1310` payloads:

- Lighting exists as `ligthing?` (API spelling) and is optional — only about 40% of courts report it
- There is **no hoop-count field**. `basketball-field-type` is free-text Finnish (full court, mini court, one-basket, streetball, …)
- Other optional properties: surface, dimensions, free use, school use, toilet, adjustable height, water point, scoreboard, match clock

The app never invents values for missing fields.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` if you need to point `LIPAS_API_BASE` at another host. LIPAS itself is public and does not need an API key.

## License

Hoop Finder is licensed under the [GNU Affero General Public License v3.0](LICENSE).

You can use, study, and change the code. If you distribute it or run a modified version as a public service, you must share your source under the same license. The license covers this codebase, not the idea of finding basketball courts.

## Next sources (server-side keys only)

- Finnish Meteorological Institute — weather and playability
- Helsinki Linked Events — nearby basketball events
- Digitransit GraphQL — HSL routes
- OpenStreetMap + a routing service — cycling directions
