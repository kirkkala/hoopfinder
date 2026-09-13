import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Court } from "@/lib/courts";
import { getLipasCourts } from "@/lib/sources/lipas";
import { getOsmCourts } from "@/lib/sources/osm";

type SourceSnapshot = { fetchedAt: string; courts: Court[] };

const outFile = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "courts.json");

async function main() {
  const previous = await readPrevious();

  const lipas = await fetchOrKeep("LIPAS", getLipasCourts, previous?.lipas);
  const osm = await fetchOrKeep("OpenStreetMap", getOsmCourts, previous?.osm);

  if (!lipas || !osm) {
    throw new Error("Need a LIPAS and OSM snapshot. Fix the failing fetch or keep data/courts.json.");
  }

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify({ lipas, osm }));
  console.log(`Wrote ${outFile}`);
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
