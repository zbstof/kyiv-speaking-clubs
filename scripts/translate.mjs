// Fills missing or outdated translations for all clubs (or the given ids).
//   OPENAI_API_KEY=... node scripts/translate.mjs [--force] [id...]
// Reads OPENAI_API_KEY and OPENAI_MODEL from .env when they are not in the environment.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { clubToYaml } from "../lib/club.mjs";
import { translateClub, pending } from "../lib/i18n.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(join(root, ".env"))) for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || "gpt-5-mini";
if (!apiKey) { console.error("OPENAI_API_KEY is not set"); process.exit(1); }

const dir = join(root, "data", "clubs");
const force = process.argv.includes("--force");   // re-translate even if translations look current
const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const files = ids.length ? ids.map((id) => `${id}.yaml`) : readdirSync(dir).filter((f) => f.endsWith(".yaml"));
const todo = files.map((f) => ({ f, club: yaml.load(readFileSync(join(dir, f), "utf8"), { schema: yaml.JSON_SCHEMA }) }))
  .map((j) => { if (force) { delete j.club.i18n; delete j.club.i18n_src; } return j; })
  .filter(({ club }) => pending(club).length);
console.log(`${todo.length} clubs need translations (model ${model})`);

let done = 0, strings = 0, failed = 0;
const worker = async () => {
  for (let job; (job = todo.shift()); ) {
    try {
      const n = await translateClub(job.club, { apiKey, model });
      strings += n;
      writeFileSync(join(dir, job.f), clubToYaml(job.club));
    } catch (e) { failed++; console.error(`${job.f}: ${e.message}`); }
    if (++done % 20 === 0) console.log(`  ${done} clubs…`);
  }
};
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`done: ${done} clubs, ${strings} strings, ${failed} failed`);
