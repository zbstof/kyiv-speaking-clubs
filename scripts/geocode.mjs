// Fills location.lat/lon for clubs that have an address or venue but no coordinates.
//   node scripts/geocode.mjs            # all clubs missing coordinates
//   node scripts/geocode.mjs id1 id2    # only these clubs
// Sets geocoded: true on every result, so a person knows to check the dot on a map.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { clubToYaml } from "../lib/club.mjs";
import { geocode } from "../lib/geo.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data", "clubs");
const only = process.argv.slice(2);
const files = only.length ? only.map((id) => `${id}.yaml`) : readdirSync(dir).filter((f) => f.endsWith(".yaml"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let found = 0, missed = [];
for (const f of files) {
  const club = yaml.load(readFileSync(join(dir, f), "utf8"), { schema: yaml.JSON_SCHEMA });
  const loc = club.location;
  if (!loc || loc.lat !== undefined || (!loc.address && !loc.venue && !loc.metro) || club.format === "online") continue;
  const hit = await geocode(loc, { wait: () => sleep(1100) });
  await sleep(1100);
  if (!hit) { missed.push(`${club.id}: ${loc.address || loc.venue}`); continue; }
  club.location = { ...loc, lat: hit.lat, lon: hit.lon, geocoded: true, ...(hit.nearMetro ? { near_metro: true } : {}) };
  writeFileSync(join(dir, f), clubToYaml(club));
  found++;
  console.log(`${club.id}\n   query: ${hit.query}\n   match: ${hit.match.slice(0, 110)}`);
}
console.log(`\ngeocoded ${found}; not found ${missed.length}`);
missed.forEach((m) => console.log("  - " + m));
