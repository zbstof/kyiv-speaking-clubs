// Helpers shared by scripts/ and worker/: stable field order, YAML output, slugs.
import yaml from "js-yaml";

const KEY_ORDER = [
  "id", "name", "description", "languages", "levels", "format", "location", "schedule", "schedule_note",
  "price", "registration", "contacts", "organizer", "status", "first_seen", "last_seen", "last_checked",
  "sources", "notes",
];
// Text fields hold { uk, en }; keep that order in every file.
const LOCALIZED = new Set(["name", "description", "schedule_note", "notes"]);
const LOCALIZED_IN = { location: ["venue", "address", "metro", "note"], price: ["amount"], contacts: ["note"] };
const langOrder = (v) => (v && typeof v === "object" && !Array.isArray(v) ? ordered(v, ["uk", "en"]) : v);
const SUB_ORDER = {
  location: ["venue", "address", "metro", "note", "lat", "lon", "geocoded", "near_metro", "map_url"],
  schedule: ["day", "time", "duration_min", "frequency", "format"],
  price: ["kind", "amount"],
  contacts: ["type", "url", "access", "note", "members", "members_checked"],
};

const isEmpty = (v) => v === undefined || v === null || v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

function ordered(obj, order) {
  const out = {};
  for (const k of order) if (!isEmpty(obj[k])) out[k] = obj[k];
  return out;
}

// Returns a copy with known keys in a fixed order and empty values removed.
export function normalizeClub(club) {
  const c = ordered(club, KEY_ORDER);
  for (const k of LOCALIZED) if (k in c) c[k] = langOrder(c[k]);
  for (const [k, order] of Object.entries(SUB_ORDER)) {
    if (!(k in c)) continue;
    const loc = (x) => { for (const f of LOCALIZED_IN[k] || []) if (f in x) x[f] = langOrder(x[f]); return x; };
    if (Array.isArray(c[k])) {
      c[k] = c[k].map((x) => loc(ordered(x, order))).filter((x) => !isEmpty(x));
      if (!c[k].length) delete c[k];
    } else {
      c[k] = loc(ordered(c[k], order));
      if (isEmpty(c[k])) delete c[k];
    }
  }
  return c;
}

export function clubToYaml(club) {
  return yaml.dump(normalizeClub(club), { lineWidth: 100, noRefs: true, quotingType: '"' });
}

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh",
  ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ё: "io", ъ: "",
  "'": "", "ʼ": "", "’": "",
};

export function slugify(text, maxLen = 60) {
  const s = String(text).toLowerCase()
    .split("").map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch)).join("")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (s.slice(0, maxLen).replace(/-+$/, "")) || "club";
}
