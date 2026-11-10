// Refreshes members/members_checked for public Telegram contacts from their t.me pages.
//   node scripts/update-members.mjs
// Closed groups have no public page; their counts are set by hand and kept as they are.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { clubToYaml } from "../lib/club.mjs";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "clubs");
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new Map();

async function count(url) {
  const m = url.match(/^https:\/\/t\.me\/([A-Za-z][A-Za-z0-9_]{3,31})\/?$/);
  if (!m) return null;
  if (cache.has(m[1])) return cache.get(m[1]);
  await sleep(1000);
  const html = await (await fetch(`https://t.me/${m[1]}`, { headers: { "user-agent": "Mozilla/5.0 (kyiv-speaking-clubs)" } })).text();
  const extra = html.match(/<div class="tgme_page_extra">([^<]*)<\/div>/)?.[1] || "";
  const n = extra.match(/^([\d\s ]+)\s+(members|subscribers)/);
  const value = n ? parseInt(n[1].replace(/\D/g, ""), 10) : null;   // personal accounts show "@name", not a count
  cache.set(m[1], value);
  return value;
}

let changed = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith(".yaml"))) {
  const club = yaml.load(readFileSync(join(dir, f), "utf8"), { schema: yaml.JSON_SCHEMA });
  let touched = false;
  for (const ct of club.contacts || []) {
    if (ct.type !== "telegram" || !ct.url) continue;
    const n = await count(ct.url);
    if (n === null) continue;
    if (ct.members !== n) { ct.members = n; touched = true; }
    ct.members_checked = today;
    touched = true;
  }
  if (touched) { writeFileSync(join(dir, f), clubToYaml(club)); changed++; console.log(club.id, (club.contacts || []).filter((c) => c.members !== undefined).map((c) => `${c.url} ${c.members}`).join("; ")); }
}
console.log(`updated ${changed} clubs`);
