import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Court } from "@/lib/courts";
import { getLipasCourts } from "@/lib/sources/lipas";
import { getOsmCourts } from "@/lib/sources/osm";

type SourceSnapshot = { fetchedAt: string; courts: Court[] };

const outFile = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "courts.json");

function parseArgs(argv: string[]) {
  const lipasOnly = argv.includes("--lipas-only");
  const osmOnly = argv.includes("--osm-only");
  if (lipasOnly && osmOnly) {
    throw new Error("Use either --lipas-only or --osm-only, not both.");
  }
  return { fetchLipas: !osmOnly, fetchOsm: !lipasOnly };
}

async function main() {
  const { fetchLipas, fetchOsm } = parseArgs(process.argv.slice(2));
  const previous = await readPrevious();

  const lipas = fetchLipas
    ? await fetchOrKeep("LIPAS", getLipasCourts, previous?.lipas)
    : keepPrevious("LIPAS", previous?.lipas);
  const osm = fetchOsm
    ? await fetchOrKeep("OpenStreetMap", getOsmCourts, previous?.osm)
    : keepPrevious("OpenStreetMap", previous?.osm);

  if (!lipas || !osm) {
    throw new Error("Need a LIPAS and OSM snapshot. Fix the failing fetch or keep data/courts.json.");
  }

  const next = { lipas: serialize(lipas), osm: serialize(osm) };
  const nextRaw = formatSnapshot(next);
  const previousRaw =
    previous?.lipas && previous.osm
      ? formatSnapshot({ lipas: serialize(previous.lipas), osm: serialize(previous.osm) })
      : "";
  if (nextRaw === previousRaw) {
    console.log("No court data changes");
    return;
  }

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, nextRaw);
  console.log(`Wrote ${outFile}`);
}

function serialize(snapshot: SourceSnapshot): SourceSnapshot {
  return {
    fetchedAt: snapshot.fetchedAt,
    courts: sortCourts(snapshot.courts),
  };
}

function formatSnapshot(snapshot: { lipas: SourceSnapshot; osm: SourceSnapshot }): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

function sortCourts(courts: Court[]): Court[] {
  return [...courts].sort((a, b) => a.id.localeCompare(b.id));
}

function keepPrevious(
  label: string,
  previous: SourceSnapshot | undefined,
): SourceSnapshot | undefined {
  if (!previous?.courts.length) {
    console.error(`${label} was skipped and there is no previous snapshot.`);
    return undefined;
  }
  console.log(`${label} kept (${previous.courts.length} from ${previous.fetchedAt})`);
  return previous;
}

async function fetchOrKeep(
  label: string,
  fetchCourts: () => Promise<Court[]>,
  previous: SourceSnapshot | undefined,
): Promise<SourceSnapshot | undefined> {
  try {
    console.log(`Fetching ${label}…`);
    const courts = await fetchCourts();
    if (courts.length === 0) throw new Error("no courts");
    if (previous && JSON.stringify(sortCourts(previous.courts)) === JSON.stringify(sortCourts(courts))) {
      console.log(`${label} ${courts.length} (unchanged)`);
      return previous;
    }
    console.log(`${label} ${courts.length}`);
    return { fetchedAt: new Date().toISOString(), courts };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    if (!previous?.courts.length) {
      console.error(`${label} failed (${message}) and there is no previous snapshot.`);
      return undefined;
    }
    console.warn(
      `${label} failed (${message}); keeping ${previous.courts.length} courts from ${previous.fetchedAt}`,
    );
    return previous;
  }
}

async function readPrevious(): Promise<{
  lipas?: SourceSnapshot;
  osm?: SourceSnapshot;
} | null> {
  try {
    return JSON.parse(await readFile(outFile, "utf8")) as {
      lipas?: SourceSnapshot;
      osm?: SourceSnapshot;
    };
  } catch {
    return null;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
