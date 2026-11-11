// Merge duplicate club files into one:
//   node scripts/merge-clubs.mjs <keep-id> <dup-id> [<dup-id> ...] [--id new-id]
// Keeps the first club's name and scalar fields where set, fills gaps from the others,
// unions languages, levels, contacts and sources, takes the earliest first_seen and the
// latest last_seen / last_checked, then deletes the duplicate files.
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { clubToYaml } from "../lib/club.mjs";
import { pick } from "../lib/i18n.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data", "clubs");
const args = process.argv.slice(2);
const idFlag = args.indexOf("--id");
const newId = idFlag >= 0 ? args.splice(idFlag, 2)[1] : null;
const ids = args;
if (ids.length < 2) { console.error("usage: merge-clubs.mjs <keep-id> <dup-id>... [--id new-id]"); process.exit(1); }

const load = (id) => yaml.load(readFileSync(join(dir, `${id}.yaml`), "utf8"), { schema: yaml.JSON_SCHEMA });
const toTime = (d) => { const [y, m = "12", dd = "28"] = d.split("-"); return Date.UTC(+y, +m - 1, +dd); };
const pickDate = (dates, latest) => dates.filter(Boolean).sort((a, b) => (latest ? toTime(b) - toTime(a) : toTime(a) - toTime(b)))[0];
const empty = (v) => v === undefined || v === "" || (Array.isArray(v) && !v.length) || (v && typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
const STATUS_RANK = { active: 0, paused: 1, unknown: 2, closed: 3 };

const clubs = ids.map(load);
const out = { ...clubs[0] };
for (const c of clubs.slice(1)) {
  for (const k of ["format", "price", "registration", "organizer", "schedule"]) if (empty(out[k]) && !empty(c[k])) out[k] = c[k];
  for (const k of ["description", "schedule_note"]) if (pick(c[k]).length > pick(out[k]).length) out[k] = c[k];
  out.location = { ...(c.location || {}), ...(out.location || {}) };
  out.languages = [...new Set([...(out.languages || []), ...(c.languages || [])])];
  out.levels = [...new Set([...(out.levels || []), ...(c.levels || [])])];
  const key = (x) => (x.url ? x.url.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "") : `${x.type}:${pick(x.note)}`);
  out.contacts = [...new Map([...(out.contacts || []), ...(c.contacts || [])].map((x) => [key(x), x])).values()];
  out.sources = [...new Set([...(out.sources || []), ...(c.sources || [])])];
  // Notes: join per language.
  const notes = {};
  for (const l of ["uk", "en"]) { const t = [...new Set([pick(out.notes, l), pick(c.notes, l)].filter(Boolean))].join(" ").slice(0, 2000); if (t) notes[l] = t; }
  out.notes = Object.keys(notes).length ? notes : undefined;
  if (STATUS_RANK[c.status] < STATUS_RANK[out.status]) out.status = c.status;
}
out.first_seen = pickDate(clubs.map((c) => c.first_seen), false);
out.last_seen = pickDate(clubs.map((c) => c.last_seen), true);
out.last_checked = pickDate(clubs.map((c) => c.last_checked), true);
if (newId) out.id = newId;

if (newId && existsSync(join(dir, `${newId}.yaml`)) && !ids.includes(newId)) { console.error(`${newId}.yaml already exists`); process.exit(1); }
for (const id of ids) unlinkSync(join(dir, `${id}.yaml`));
writeFileSync(join(dir, `${out.id}.yaml`), clubToYaml(out));
console.log(`merged ${ids.join(", ")} -> ${out.id}`);
