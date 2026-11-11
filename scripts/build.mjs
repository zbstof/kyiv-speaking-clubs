// Reads data/clubs/*.yaml, checks each file against schema/club.schema.json,
// and writes site/clubs.json. With --check it only validates.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv from "ajv";
import { extraChecks } from "../lib/rules.mjs";
import { pick } from "../lib/i18n.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clubsDir = join(root, "data", "clubs");
const checkOnly = process.argv.includes("--check");

const schema = JSON.parse(readFileSync(join(root, "schema", "club.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true }).compile(schema);

const errors = [];
const clubs = [];
const files = readdirSync(clubsDir).filter((f) => f.endsWith(".yaml")).sort();

for (const file of files) {
  let club;
  try {
    // JSON_SCHEMA keeps dates like 2024-05-01 as strings instead of Date objects.
    club = yaml.load(readFileSync(join(clubsDir, file), "utf8"), { schema: yaml.JSON_SCHEMA });
  } catch (e) {
    errors.push(`${file}: YAML error: ${e.message}`);
    continue;
  }
  if (!validate(club)) {
    for (const err of validate.errors) {
      errors.push(`${file}: ${err.instancePath || "/"} ${err.message}${err.params?.allowedValues ? " " + JSON.stringify(err.params.allowedValues) : ""}`);
    }
    continue;
  }
  const extra = extraChecks(club);
  if (extra.length) {
    errors.push(...extra.map((e) => `${file}: ${e}`));
    continue;
  }
  if (club.id !== basename(file, ".yaml")) {
    errors.push(`${file}: id "${club.id}" must match the file name`);
    continue;
  }
  clubs.push(club);
}

if (errors.length) {
  console.error(`${errors.length} problem(s):\n` + errors.map((e) => "  " + e).join("\n"));
  process.exit(1);
}

console.log(`${clubs.length} clubs OK`);
if (!checkOnly) {
  const out = { generated: new Date().toISOString(), clubs };
  writeFileSync(join(root, "site", "clubs.json"), JSON.stringify(out));
  console.log("wrote site/clubs.json");

  writePages(clubs);
}

// ---------- static pages: /en/, /clubs/<id>/, /en/clubs/<id>/, sitemap.xml, robots.txt ----------
// Every page is site/index.html with its own head (language, title, description, canonical, hreflang,
// Open Graph, schema.org) and, for a club, a short summary in the HTML. The script replaces the summary
// with the full list and focuses that club, so people see the usual page and crawlers see the club.
function writePages(clubs) {
  const BASE = "https://speaking-clubs.zbstof.me";
  const site = join(root, "site");
  const template = readFileSync(join(site, "index.html"), "utf8");
  const path = (lang, id) => (lang === "en" ? "/en/" : "/") + (id ? `clubs/${id}/` : "");
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const tx = (c, lang, p, v) => pick(v, lang);   // text fields hold { uk, en }
  const T = {
    uk: { site: "Розмовні клуби Києва", desc: "Розмовні клуби Києва: мови, розклад, адреси, контакти. Список редагують відвідувачі.",
      days: { mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб", sun: "Нд" }, metro: "м.", back: "Усі клуби" },
    en: { site: "Kyiv Speaking Clubs", desc: "Language speaking clubs in Kyiv: languages, schedules, addresses, contacts. Visitors keep the list up to date.",
      days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }, metro: "metro", back: "All clubs" },
  };

  function head(html, lang, club) {
    const L = T[lang];
    const title = club ? `${tx(club, lang, "name", club.name)} — ${L.site}` : L.site;
    const desc = club ? (tx(club, lang, "description", club.description) || L.desc).replace(/\s+/g, " ").slice(0, 300) : L.desc;
    const id = club?.id;
    const swap = (from, to) => { if (!html.includes(from)) throw new Error("build: template text not found: " + from.slice(0, 60)); html = html.replace(from, to); };
    swap('<html lang="uk">', `<html lang="${lang}">`);
    swap("<title>Розмовні клуби Києва</title>", `<title>${esc(title)}</title>`);
    swap('content="Розмовні клуби Києва: мови, розклад, адреси, контакти. Список редагують відвідувачі."', `content="${esc(desc)}"`);
    swap('<link rel="canonical" href="https://speaking-clubs.zbstof.me/">', `<link rel="canonical" href="${BASE}${path(lang, id)}">`);
    swap('<link rel="alternate" hreflang="uk" href="https://speaking-clubs.zbstof.me/">', `<link rel="alternate" hreflang="uk" href="${BASE}${path("uk", id)}">`);
    swap('<link rel="alternate" hreflang="en" href="https://speaking-clubs.zbstof.me/en/">', `<link rel="alternate" hreflang="en" href="${BASE}${path("en", id)}">`);
    swap('<link rel="alternate" hreflang="x-default" href="https://speaking-clubs.zbstof.me/">', `<link rel="alternate" hreflang="x-default" href="${BASE}${path("uk", id)}">`
      + `\n  <meta property="og:type" content="website">\n  <meta property="og:title" content="${esc(title)}">\n  <meta property="og:description" content="${esc(desc)}">`
      + `\n  <meta property="og:url" content="${BASE}${path(lang, id)}">\n  <meta property="og:locale" content="${lang === "en" ? "en_GB" : "uk_UA"}">`
      + (club ? `\n  <script type="application/ld+json">${JSON.stringify(jsonLd(club, lang)).replace(/</g, "\\u003c")}</script>` : ""));
    swap('<h1><a href="/" id="home" data-i18n="title">Розмовні клуби Києва</a></h1>', `<h1><a href="${path(lang)}" id="home" data-i18n="title">${esc(L.site)}</a></h1>`);
    swap('<a href="/" data-ui="uk" hreflang="uk" lang="uk" aria-current="true">UA</a>',
      `<a href="${path("uk", id)}" data-ui="uk" hreflang="uk" lang="uk"${lang === "uk" ? ' aria-current="true"' : ""}>UA</a>`);
    swap('<a href="/en/" data-ui="en" hreflang="en" lang="en">EN</a>',
      `<a href="${path("en", id)}" data-ui="en" hreflang="en" lang="en"${lang === "en" ? ' aria-current="true"' : ""}>EN</a>`);
    if (club) swap('<main class="wrap">', `<main class="wrap">\n${summary(club, lang)}`);
    return html;
  }

  function summary(c, lang) {
    const L = T[lang], loc = c.location || {};
    const sched = (c.schedule || []).map((s) => `${L.days[s.day]}${s.time ? " " + s.time : ""}`).join(", ");
    const place = [tx(c, lang, "location.venue", loc.venue), tx(c, lang, "location.address", loc.address),
      loc.metro && `${L.metro} ${tx(c, lang, "location.metro", loc.metro)}`].filter(Boolean).join(", ");
    const links = (c.contacts || []).filter((ct) => ct.url && /^https?:/.test(ct.url) && ct.access !== "on_request")
      .map((ct) => `<a href="${esc(ct.url)}" rel="nofollow">${esc(ct.type)}</a>`).join(" · ");
    return `    <article class="prerender" id="prerender">
      <h2>${esc(tx(c, lang, "name", c.name))}</h2>
      ${c.description ? `<p>${esc(tx(c, lang, "description", c.description))}</p>` : ""}
      ${sched || c.schedule_note ? `<p>🗓 ${esc(sched)}${sched && c.schedule_note ? " — " : ""}${esc(tx(c, lang, "schedule_note", c.schedule_note))}</p>` : ""}
      ${place ? `<p>📍 ${esc(place)}</p>` : ""}
      ${links ? `<p>${links}</p>` : ""}
      <p><a href="${path(lang)}">${esc(L.back)}</a></p>
    </article>`;
  }

  function jsonLd(c, lang) {
    const loc = c.location || {};
    const sameAs = (c.contacts || []).filter((ct) => ct.url && /^https?:/.test(ct.url) && ct.access !== "on_request").map((ct) => ct.url);
    return {
      "@context": "https://schema.org", "@type": "Organization",
      name: tx(c, lang, "name", c.name), url: BASE + path(lang, c.id),
      ...(c.description ? { description: tx(c, lang, "description", c.description) } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      knowsLanguage: c.languages,
      ...(loc.address || loc.lat !== undefined ? { location: { "@type": "Place",
        ...(loc.venue ? { name: tx(c, lang, "location.venue", loc.venue) } : {}),
        address: { "@type": "PostalAddress", ...(loc.address ? { streetAddress: tx(c, lang, "location.address", loc.address) } : {}), addressLocality: lang === "en" ? "Kyiv" : "Київ", addressCountry: "UA" },
        ...(loc.lat !== undefined ? { geo: { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lon } } : {}) } } : {}),
    };
  }

  // Fresh output every build, so a removed club does not leave its page behind.
  for (const dir of ["en", "clubs"]) rmSync(join(site, dir), { recursive: true, force: true });
  const write = (rel, html) => { mkdirSync(join(site, rel), { recursive: true }); writeFileSync(join(site, rel, "index.html"), html); };
  write("en", head(template, "en", null));
  for (const c of clubs) for (const lang of ["uk", "en"]) write(path(lang, c.id).slice(1), head(template, lang, c));

  // Sitemap: every page with its other-language version; lastmod from the club's latest full date.
  const lastmod = (c) => [c.last_checked, c.last_seen].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "")).sort().pop();
  const entry = (id, lang, mod) => `  <url><loc>${BASE}${path(lang, id)}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ""}`
    + ["uk", "en"].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${path(l, id)}"/>`).join("")
    + `<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${path("uk", id)}"/></url>`;
  const urls = [entry(null, "uk"), entry(null, "en"), ...clubs.flatMap((c) => ["uk", "en"].map((l) => entry(c.id, l, lastmod(c))))];
  writeFileSync(join(site, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`);
  writeFileSync(join(site, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
  console.log(`wrote ${1 + clubs.length * 2} pages, sitemap.xml (${urls.length} urls), robots.txt`);
}
