// Bulk import: node scripts/import-research.mjs file1.yaml file2.yaml ...
// Each input is a YAML (or JSON) list of research records (see README "Research record format").
// Merges records with the same name, maps fields to the club schema, and writes data/clubs/<id>.yaml.
// Existing files are not overwritten unless --force is given.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { clubToYaml, slugify } from "../lib/club.mjs";
import { INVITE_RE } from "../lib/rules.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const force = args.includes("--force");
const files = args.filter((a) => !a.startsWith("--"));
const TODAY = new Date();
const ACTIVE_DAYS = 183;

const DAY_ALIASES = { mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat", sun: "sun", monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu", friday: "fri", saturday: "sat", sunday: "sun" };
const CONTACT_TYPES = new Set(["telegram", "instagram", "facebook", "website", "meetup", "email", "phone", "youtube", "whatsapp", "viber", "discord", "other"]);
const LEVELS = new Set(["any", "A1", "A2", "B1", "B2", "C1", "C2"]);

const s = (v) => (v === null || v === undefined ? undefined : String(v).trim() || undefined);
const date = (v) => {
  const t = s(v);
  if (!t) return undefined;
  const m = t.match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
  if (!m) return undefined;
  return [m[1], m[2]?.padStart(2, "0"), m[3]?.padStart(2, "0")].filter(Boolean).join("-");
};
const toTime = (d) => { const [y, m = "12", dd = "28"] = d.split("-"); return Date.UTC(+y, +m - 1, +dd); };
const latest = (...ds) => ds.filter(Boolean).sort((a, b) => toTime(b) - toTime(a))[0];
const earliest = (...ds) => ds.filter(Boolean).sort((a, b) => toTime(a) - toTime(b))[0];
const normUrl = (u) => u.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "").replace(/^t\.me\/s\//, "t.me/");
const normName = (n) => slugify(n).replace(/-(kyiv|kiev|kyieve|kyievi)$/, "");

function contactType(type, url) {
  const t = String(type || "").toLowerCase();
  if (CONTACT_TYPES.has(t)) return t;
  if (/t\.me|telegram/.test(url)) return "telegram";
  if (/instagram/.test(url)) return "instagram";
  if (/facebook|fb\.com/.test(url)) return "facebook";
  if (/meetup\.com/.test(url)) return "meetup";
  if (/youtube|youtu\.be/.test(url)) return "youtube";
  if (/@/.test(url) && !/\//.test(url)) return "email";
  return /^https?:/.test(url) ? "website" : "other";
}

function mapRecord(r) {
  const contacts = [];
  for (const c of r.contacts || []) {
    const url = s(c.url);
    if (!url) continue;
    const type = contactType(c.type, url);
    if (INVITE_RE.test(url)) {
      // Never publish private invite links from research; the moderator can add them with the admins' consent.
      contacts.push({ type, access: "on_request", note: "Запрошення в організатора" });
    } else {
      contacts.push({ type, url });
    }
  }
  const schedule = (r.schedule || []).map((x) => {
    const day = DAY_ALIASES[String(x?.day || "").toLowerCase()];
    if (!day) return null;
    const time = s(x.time)?.match(/^(\d{1,2}):(\d{2})/);
    const freq = ["weekly", "biweekly", "monthly", "irregular"].includes(x.frequency) ? x.frequency : undefined;
    const dur = parseInt(x.duration_min, 10);
    return { day, time: time ? `${time[1].padStart(2, "0")}:${time[2]}` : undefined, duration_min: dur >= 10 && dur <= 600 ? dur : undefined, frequency: freq,
      format: ["offline", "online"].includes(x.format) ? x.format : undefined };
  }).filter(Boolean);
  const loc = r.location || {};
  return {
    name: s(r.name)?.slice(0, 150),
    description: s(r.description)?.slice(0, 2000),
    languages: [...new Set((r.languages || []).map((l) => String(l).toLowerCase().trim()).filter((l) => /^[a-z]{2,3}$/.test(l)))],
    levels: [...new Set((r.levels || []).map((l) => (String(l).toLowerCase() === "any" ? "any" : String(l).toUpperCase())).filter((l) => LEVELS.has(l)))],
    format: ["offline", "online", "hybrid"].includes(r.format) ? r.format : undefined,
    location: { venue: s(loc.venue), address: s(loc.address), metro: s(loc.metro), note: s(loc.note)?.slice(0, 300) },
    schedule,
    schedule_note: s(r.schedule_note)?.slice(0, 500),
    price: r.price ? { free: typeof r.price.free === "boolean" ? r.price.free : undefined, amount: s(r.price.amount)?.slice(0, 100) } : undefined,
    registration: ["required", "optional", "none"].includes(r.registration) ? r.registration : undefined,
    contacts,
    organizer: s(r.organizer)?.slice(0, 200),
    first_seen: date(r.first_seen),
    last_seen: date(r.last_seen),
    status_guess: r.status_guess,
    sources: [...new Set((r.sources || []).map(s).filter(Boolean))],
    notes: s(r.notes)?.slice(0, 2000),
  };
}

// Two records are the same club if their normalized names match. Contact URLs are not used:
// one Meetup or Facebook group often announces several different clubs.
function merge(a, b) {
  const pick = (x, y) => (x === undefined || x === "" || (Array.isArray(x) && !x.length) ? y : x);
  const longer = (x, y) => ((y || "").length > (x || "").length ? y : x);
  const contactKey = (c) => c.url ? normUrl(c.url) : c.type + ":" + c.access;
  return {
    name: a.name,
    description: longer(a.description, b.description),
    languages: [...new Set([...a.languages, ...b.languages])],
    levels: [...new Set([...a.levels, ...b.levels])],
    format: pick(a.format, b.format),
    location: Object.fromEntries(["venue", "address", "metro", "note"].map((k) => [k, pick(a.location?.[k], b.location?.[k])])),
    schedule: a.schedule.length >= b.schedule.length ? a.schedule : b.schedule,
    schedule_note: longer(a.schedule_note, b.schedule_note),
    price: pick(a.price, b.price),
    registration: pick(a.registration, b.registration),
    contacts: [...new Map([...a.contacts, ...b.contacts].map((c) => [contactKey(c), c])).values()],
    organizer: pick(a.organizer, b.organizer),
    first_seen: earliest(a.first_seen, b.first_seen),
    last_seen: latest(a.last_seen, b.last_seen),
    status_guess: a.status_guess === "active" || b.status_guess === "active" ? "active" : pick(a.status_guess, b.status_guess),
    sources: [...new Set([...a.sources, ...b.sources])],
    notes: [a.notes, b.notes].filter(Boolean).filter((x, i, all) => all.indexOf(x) === i).join(" ").slice(0, 2000) || undefined,
  };
}

const records = [];
for (const f of files) {
  const list = yaml.load(readFileSync(f, "utf8"), { schema: yaml.JSON_SCHEMA });
  if (!Array.isArray(list)) { console.error(`${f}: not a list, skipped`); continue; }
  for (const r of list) {
    const m = mapRecord(r);
    if (!m.name || !m.languages.length) { console.error(`${f}: skipped record without name or language: ${JSON.stringify(r).slice(0, 120)}`); continue; }
    records.push(m);
  }
}

const merged = [];
for (const r of records) {
  const hit = merged.find((m) => normName(m.name) === normName(r.name));
  if (hit) Object.assign(hit, merge(hit, r));
  else merged.push(r);
}

let written = 0, skipped = 0;
const used = new Set();
for (const m of merged) {
  let id = slugify(m.name);
  for (let n = 2; used.has(id); n++) id = `${slugify(m.name)}-${n}`;
  used.add(id);
  const ageDays = m.last_seen ? (TODAY - toTime(m.last_seen)) / 864e5 : Infinity;
  const status = m.status_guess === "active" && ageDays <= ACTIVE_DAYS ? "active" : "unknown";
  const { status_guess, ...rest } = m;
  const club = { id, ...rest, status };
  const path = join(root, "data", "clubs", `${id}.yaml`);
  if (existsSync(path) && !force) { skipped++; continue; }
  writeFileSync(path, clubToYaml(club));
  written++;
}
console.log(`${records.length} records -> ${merged.length} clubs; wrote ${written}, skipped ${skipped} existing`);
