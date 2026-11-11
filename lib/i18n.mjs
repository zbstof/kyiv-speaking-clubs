// Bilingual club text. Every text field holds both languages side by side: name: { uk: "…", en: "…" }.
// When only one language is present, or an edit changed one language and not the other, the other is
// translated: by fixed rules for metro names and street addresses, otherwise by the model.
// Change detection compares the club with its previous version (from main or from git), so the files
// carry no translation bookkeeping. Used by scripts/translate.mjs, scripts/build.mjs and the worker;
// site/app.js has its own small pick().
import { findStation } from "./metro.mjs";

export const LANGS = ["uk", "en"];
export const DEFAULT_MODEL = "gpt-6.1-sol";
const other = (l) => (l === "uk" ? "en" : "uk");

// Ukrainian national transliteration (Cabinet of Ministers resolution 55, 2010).
const TR = { а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "ʼ": "", "’": "" };
const TR_START = { є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya" };   // spelled this way at the start of a word
export function translit(text) {
  return text.replace(/[\u0400-\u04FFʼ’']+/g, (word) => {
    let out = "";
    const lower = word.toLowerCase().replace(/зг/g, "zgh\u0000");   // "зг" -> "zgh", not "zh"
    for (let i = 0; i < lower.length; i++) {
      const ch = lower[i];
      if (ch === "\u0000") continue;
      if (/[a-z]/.test(ch)) { out += ch; continue; }
      out += (i === 0 && TR_START[ch]) || (TR[ch] ?? ch);
    }
    return word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase() ? out.charAt(0).toUpperCase() + out.slice(1) : out;
  });
}
const titleCase = (s) => s.replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

const STREET_TYPES = [
  [/^(вул\.|вулиця)\s*/i, "St"], [/^(просп\.|проспект)\s*/i, "Ave"], [/^(бульв\.|бул\.|бульвар)\s*/i, "Blvd"],
  [/^(пров\.|провулок)\s*/i, "Ln"], [/^(пл\.|площа)\s*/i, "Sq"], [/^(наб\.|набережна)\s*/i, "Embankment"], [/^узвіз\s*/i, "Descent"],
];

// Deterministic translations for fields that follow fixed rules: metro names and plain Ukrainian street
// addresses ("вул. Новгород-Сіверська, 5" -> "5 Novhorod-Siverska St"). Returns null to leave a text to the model.
export function ruleTranslate(path, text, to) {
  if (path === "location.metro") {
    const st = findStation(text);
    if (!st) return null;
    return to === "uk" ? st.name : titleCase(translit(st.name));
  }
  if (path === "location.address" && to === "en") {
    const m = text.trim().match(/^([^,]+),\s*([\p{N}][\p{N}\p{L}\/\-–]*)$/u);
    if (!m) return null;
    let street = m[1].trim(), kind = "St";
    for (const [re, en] of STREET_TYPES) {
      // The type word can come first ("вул. Хрещатик") or last ("Оболонський просп.").
      const after = new RegExp("\\s*" + re.source.slice(1).replace(/\\s\*$/, "") + "$", "i");
      if (re.test(street)) { street = street.replace(re, ""); kind = en; break; }
      if (after.test(street)) { street = street.replace(after, ""); kind = en; break; }
    }
    if (/[A-Za-z]/.test(street)) return null;
    return `${translit(m[2]).replace(/–/g, "-").toUpperCase()} ${titleCase(translit(street))} ${kind}`;
  }
  return null;
}

// Text fields, as dotted paths into the club ("contacts.0.note" for contact notes).
const FIXED_PATHS = ["name", "description", "schedule_note", "notes", "location.venue", "location.address",
  "location.metro", "location.note", "price.amount"];
export const textPaths = (club) => [...FIXED_PATHS, ...(club.contacts || []).map((_, i) => `contacts.${i}.note`)];

export function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[/^\d+$/.test(k) ? +k : k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[/^\d+$/.test(k) ? +k : k] ??= {};
  o[keys.at(-1)] = value;
}

// A text value in one language, falling back to the other. Accepts a plain string too.
export function pick(v, lang = "uk") {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return v[lang] || v[other(lang)] || "";
}

// "uk", "ru", "en" or null, by alphabet. Used to file plain strings (imports, old data) under a language.
export function detectLang(text) {
  const cyr = (text.match(/[\u0400-\u04FF]/g) || []).length;
  const lat = (text.match(/[A-Za-z]/g) || []).length;
  if (!cyr && !lat) return null;
  if (cyr >= lat) return /[ыэъё]/i.test(text) && !/[іїєґ]/i.test(text) ? "ru" : "uk";
  return "en";
}

// What needs translating: [{ path, from, to, text }].
// - One language present: translate it into the other.
// - Both present and `old` given: if exactly one language changed since `old`, translate it into the other.
//   If both changed, both are someone's own words and stay.
export function pending(club, old) {
  const items = [];
  for (const path of textPaths(club)) {
    const v = getPath(club, path);
    if (!v || typeof v !== "object") continue;
    const have = LANGS.filter((l) => typeof v[l] === "string" && v[l].trim());
    if (have.length === 1) { items.push({ path, from: have[0], to: other(have[0]), text: v[have[0]] }); continue; }
    if (have.length !== 2 || !old) continue;
    const before = getPath(old, path);
    // An old plain string has no language to compare against (the format before { uk, en }): no change detection.
    if (typeof before === "string") continue;
    const was = (l) => (before && typeof before === "object" ? before[l] : undefined);
    const changed = LANGS.filter((l) => v[l] !== was(l));
    if (changed.length === 1) items.push({ path, from: changed[0], to: other(changed[0]), text: v[changed[0]] });
  }
  return items;
}

const PROMPT = `You translate short texts for a public directory of language speaking clubs in Kyiv, Ukraine.
For each item, write it in every language listed in "to" (uk = Ukrainian, en = English).
Rules:
- Ukrainian must be natural modern Ukrainian, never Russian or surzhyk.
- Club names that are brands or titles stay exactly as written, even if they contain ordinary words:
  "LEC Philosophy Club", "Off the Page", "In Conversation With", "BlaBla English UA", "Small Talk English Speaking Club".
  Translate only club names that are plain descriptions ("Розмовний клуб англійської в бібліотеці" -> "English speaking club at the library").
- Into English, Cyrillic must not remain: give Ukrainian names their usual English form or a standard transliteration
  ("Публічна бібліотека ім. Лесі Українки" -> "Lesya Ukrainka Public Library", "Пузата Хата" -> "Puzata Khata").
- Into Ukrainian, Ukrainian names written in Latin letters get their Ukrainian spelling ("Puzata Khata" -> "Пузата Хата",
  "Zoloti Vorota" -> "Золоті ворота", "Khreshchatyk" -> "Хрещатик"); international brands stay in Latin ("X Lounge", "Genesis Cafe").
- Addresses into Ukrainian use Ukrainian order: "1/2 Baseina Street" -> "вул. Басейна, 1/2". Into English: "42 Volodymyrska St".
- Keep unchanged: Telegram @handles, URLs, phone numbers, times, dates and prices.
- Quotation marks: «…» in Ukrainian text, "…" in English text.
- Keep the meaning and length; do not add facts. Plain text, no markdown.
Return only a JSON object: {"<id>": {"<lang>": "<text>"}, ...}.`;

// Translates everything pending (see pending()) and writes the results into the club.
// Returns the number of strings written. Throws on API errors; callers decide whether that blocks anything.
export async function translateClub(club, { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch, old } = {}) {
  const all = pending(club, old);
  let written = 0;
  const items = [];
  for (const it of all) {
    const t = ruleTranslate(it.path, it.text, it.to);
    if (t) { setPath(club, `${it.path}.${it.to}`, t); written++; } else items.push(it);
  }
  if (!items.length) return written;
  if (!apiKey) throw new Error("no OPENAI_API_KEY for " + items.length + " texts");
  const payload = items.map((it, i) => ({ id: String(i), from: it.from, to: [it.to], text: it.text }));
  const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, response_format: { type: "json_object" },
      messages: [{ role: "system", content: PROMPT }, { role: "user", content: JSON.stringify(payload) }] }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = JSON.parse((await res.json()).choices[0].message.content);
  items.forEach((it, i) => {
    const t = out[String(i)]?.[it.to];
    if (typeof t === "string" && t.trim()) { setPath(club, `${it.path}.${it.to}`, t.trim().slice(0, 2000)); written++; }
  });
  return written;
}
