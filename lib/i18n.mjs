// Bilingual club text. Each club keeps its fields as written; translations of the missing language
// live in club.i18n[lang][path], and club.i18n_src[path] holds a hash of the source text they were
// made from, so an edited source gets translated again. Used by scripts/translate.mjs and the worker.
// site/app.js has copies of detectLang and TEXT_PATHS; keep them in sync.

export const LANGS = ["uk", "en"];

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
- Keep unchanged: Telegram @handles, URLs, phone numbers, times, dates and prices.
- Into English, Cyrillic must not remain: give Ukrainian names their usual English form or a standard transliteration
  ("Публічна бібліотека ім. Лесі Українки" -> "Lesya Ukrainka Public Library", "Пузата Хата" -> "Puzata Khata",
  "вул. Володимирська, 42" -> "42 Volodymyrska St"). Keep «» quotes as "".
- Into Ukrainian, keep Latin brand and club names as they are ("BlaBla English UA", "X Lounge").
- If the whole item is a brand or club name written in the target language's script already, return it unchanged.
- Translate descriptive names (e.g. "Розмовний клуб англійської в бібліотеці" -> "English speaking club at the library").
- Keep the meaning and length; do not add facts. Plain text, no markdown.
Return only a JSON object: {"<id>": {"<lang>": "<text>"}, ...}.`;

// Translates everything pending for one club with the OpenAI Chat Completions API and stores the result.
// Returns the number of strings written. Throws on API errors; callers decide whether that blocks anything.
export async function translateClub(club, { apiKey, model = "gpt-5-mini", fetchImpl = fetch }) {
  const items = pending(club);
  if (!items.length) { prune(club); return 0; }
  const payload = items.map((it, i) => ({ id: String(i), from: it.from, to: it.to, text: it.text }));
  const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, response_format: { type: "json_object" },
      messages: [{ role: "system", content: PROMPT }, { role: "user", content: JSON.stringify(payload) }] }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = JSON.parse((await res.json()).choices[0].message.content);
  let written = 0;
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
