// Reads data/clubs/*.yaml, checks each file against schema/club.schema.json,
// and writes site/clubs.json. With --check it only validates.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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
}
