// Reads data/clubs/*.yaml, checks each file against schema/club.schema.json,
// and writes site/clubs.json. With --check it only validates.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv from "ajv";
import { extraChecks } from "../lib/rules.mjs";

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

  // English version at /en/: same page, with the language, title, description and heading already in
  // English, so search engines and link previews see English without running the script.
  const html = readFileSync(join(root, "site", "index.html"), "utf8");
  const en = [
    ['<html lang="uk">', '<html lang="en">'],
    ["<title>Розмовні клуби Києва</title>", "<title>Kyiv Speaking Clubs</title>"],
    ['content="Розмовні клуби Києва: мови, розклад, адреси, контакти. Список редагують відвідувачі."',
     'content="Language speaking clubs in Kyiv: languages, schedules, addresses, contacts. Visitors keep the list up to date."'],
    ['<link rel="canonical" href="https://speaking-clubs.zbstof.me/">', '<link rel="canonical" href="https://speaking-clubs.zbstof.me/en/">'],
    ['<h1 data-i18n="title">Розмовні клуби Києва</h1>', '<h1 data-i18n="title">Kyiv Speaking Clubs</h1>'],
    ['<a href="/" data-ui="uk" hreflang="uk" lang="uk" aria-current="true">UA</a>', '<a href="/" data-ui="uk" hreflang="uk" lang="uk">UA</a>'],
    ['<a href="/en/" data-ui="en" hreflang="en" lang="en">EN</a>', '<a href="/en/" data-ui="en" hreflang="en" lang="en" aria-current="true">EN</a>'],
  ].reduce((h, [from, to]) => { if (!h.includes(from)) throw new Error("build: /en/ template text not found: " + from); return h.replace(from, to); }, html);
  mkdirSync(join(root, "site", "en"), { recursive: true });
  writeFileSync(join(root, "site", "en", "index.html"), en);
  console.log("wrote site/en/index.html");
}
