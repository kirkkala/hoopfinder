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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API keys are not required.

## License

[GNU Affero General Public License v3.0](LICENSE).
