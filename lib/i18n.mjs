// Bilingual club text. Each club keeps its fields as written; translations of the missing language
// live in club.i18n[lang][path], and club.i18n_src[path] holds a hash of the source text they were
// made from, so an edited source gets translated again. Used by scripts/translate.mjs and the worker.
// site/app.js has copies of detectLang and TEXT_PATHS; keep them in sync.

import { findStation } from "./metro.mjs";

export const LANGS = ["uk", "en"];
export const DEFAULT_MODEL = "gpt-6.1-sol";

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

// Text fields a reader needs, as [path, value]. Links and handles are not translated; addresses and
// metro names are, so an English reader gets them in Latin letters.
export function textFields(club) {
  const out = [];
  const add = (path, v) => { if (typeof v === "string" && v.trim()) out.push([path, v]); };
  add("name", club.name);
  add("description", club.description);
  add("schedule_note", club.schedule_note);
  add("notes", club.notes);
  add("location.venue", club.location?.venue);
  add("location.address", club.location?.address);
  add("location.metro", club.location?.metro);
  add("location.note", club.location?.note);
  add("price.amount", club.price?.amount);
  (club.contacts || []).forEach((ct, i) => add(`contacts.${i}.note`, ct.note));
  return out;
}

// "uk" for Ukrainian, "ru" for Russian, "en" for Latin-script text, null when there is nothing to tell by.
export function detectLang(text) {
  const cyr = (text.match(/[Ѐ-ӿ]/g) || []).length;
  const lat = (text.match(/[A-Za-z]/g) || []).length;
  if (!cyr && !lat) return null;
  if (cyr >= lat) return /[ыэъё]/i.test(text) && !/[іїєґ]/i.test(text) ? "ru" : "uk";
  return "en";
}

// FNV-1a, 32 bit, as 8 hex digits: short, stable, the same in Node and in the worker.
export function hash(text) {
  let h = 0x811c9dc5;
  for (const ch of new TextEncoder().encode(text)) { h ^= ch; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

// What still needs translating: [{ path, text, from, to: [langs] }].
export function pending(club) {
  const items = [];
  for (const [path, text] of textFields(club)) {
    const from = detectLang(text);
    if (!from) continue;
    // The hash is written only after the model answered for every target language (an unchanged
    // proper name counts as an answer and is not stored), so a matching hash means "done".
    if (club.i18n_src?.[path] === hash(text)) continue;
    // Mixed scripts ("Закрита група English Psychology & Art Club"): ask for both languages;
    // a language the text is already in comes back unchanged and is not stored.
    const mixed = (text.match(/[\u0400-\u04FF]/g) || []).length >= 3 && (text.match(/[A-Za-z]/g) || []).length >= 3;
    const to = mixed ? LANGS : LANGS.filter((l) => l !== from);
    if (to.length) items.push({ path, text, from, to });
  }
  return items;
}

// Drops translations whose source field is gone (e.g. a removed contact).
export function prune(club) {
  const live = new Set(textFields(club).map(([p]) => p));
  for (const l of LANGS) for (const p of Object.keys(club.i18n?.[l] || {})) if (!live.has(p)) delete club.i18n[l][p];
  for (const p of Object.keys(club.i18n_src || {})) if (!live.has(p)) delete club.i18n_src[p];
  for (const l of LANGS) if (club.i18n?.[l] && !Object.keys(club.i18n[l]).length) delete club.i18n[l];
  if (club.i18n && !Object.keys(club.i18n).length) delete club.i18n;
  if (club.i18n_src && !Object.keys(club.i18n_src).length) delete club.i18n_src;
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

// Translates everything pending for one club with the OpenAI Chat Completions API and stores the result.
// Returns the number of strings written. Throws on API errors; callers decide whether that blocks anything.
export async function translateClub(club, { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch }) {
  const all = pending(club);
  // Rules first; whatever they cannot do goes to the model.
  let written = 0;
  const items = [];
  for (const it of all) {
    const done = it.to.map((l) => [l, ruleTranslate(it.path, it.text, l)]);
    if (done.every(([, t]) => t)) {
      for (const [l, t] of done) if (t !== it.text) { ((club.i18n ||= {})[l] ||= {})[it.path] = t; written++; }
      (club.i18n_src ||= {})[it.path] = hash(it.text);
    } else items.push(it);
  }
  if (!items.length) { prune(club); return written; }
  const payload = items.map((it, i) => ({ id: String(i), from: it.from, to: it.to, text: it.text }));
  const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, response_format: { type: "json_object" },
      messages: [{ role: "system", content: PROMPT }, { role: "user", content: JSON.stringify(payload) }] }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = JSON.parse((await res.json()).choices[0].message.content);
  items.forEach((it, i) => {
    const got = out[String(i)] || {};
    if (!it.to.every((l) => typeof got[l] === "string" && got[l].trim())) return;   // incomplete answer: retry next time
    for (const l of it.to) {
      const t = typeof got[l] === "string" ? got[l].trim().slice(0, 2000) : "";
      if (!t || t === it.text) continue;   // unchanged proper names are not stored; the hash below still marks them done
      ((club.i18n ||= {})[l] ||= {})[it.path] = t;
      written++;
    }
    (club.i18n_src ||= {})[it.path] = hash(it.text);
  });
  prune(club);
  return written;
}
