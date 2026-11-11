// Fills the missing language of every text field, and redoes the other language where only one changed.
//   node scripts/translate.mjs                  # compare with the last commit (HEAD): your uncommitted edits
//   node scripts/translate.mjs --since main~3   # compare with an older commit, e.g. after editing on GitHub
//   node scripts/translate.mjs [--since ref] id1 id2
// Reads OPENAI_API_KEY and OPENAI_MODEL from .env when they are not in the environment.
// Metro names and plain Ukrainian street addresses need no key: fixed transliteration rules.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { clubToYaml } from "../lib/club.mjs";
import { translateClub, pending, DEFAULT_MODEL } from "../lib/i18n.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(join(root, ".env"))) for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

const args = process.argv.slice(2);
const sinceAt = args.indexOf("--since");
const since = sinceAt >= 0 ? args.splice(sinceAt, 2)[1] : "HEAD";
const dir = join(root, "data", "clubs");
const files = args.length ? args.map((id) => `${id}.yaml`) : readdirSync(dir).filter((f) => f.endsWith(".yaml"));
const load = (text) => yaml.load(text, { schema: yaml.JSON_SCHEMA });
// The same file at `since`, or null if it did not exist then.
const before = (f) => {
  try { return load(execFileSync("git", ["show", `${since}:data/clubs/${f}`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); }
  catch { return null; }
};

const todo = files.map((f) => ({ f, club: load(readFileSync(join(dir, f), "utf8")), old: before(f) }))
  .filter((j) => pending(j.club, j.old).length);
console.log(`${todo.length} clubs need translations (compared with ${since}; model ${model})`);

let done = 0, strings = 0, failed = 0;
const worker = async () => {
  for (let job; (job = todo.shift()); ) {
    try {
      const n = await translateClub(job.club, { apiKey, model, old: job.old });
      strings += n;
      writeFileSync(join(dir, job.f), clubToYaml(job.club));
    } catch (e) { failed++; console.error(`${job.f}: ${e.message}`); }
    if (++done % 20 === 0) console.log(`  ${done} clubs…`);
  }
};
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`done: ${done} clubs, ${strings} strings, ${failed} failed`);
