// Cloudflare Worker: takes a suggestion from the site and opens a pull request with the change.
// The pull request is the approval step: merging it publishes the change.
//
// Secrets (wrangler secret put ...): GITHUB_TOKEN, TURNSTILE_SECRET
// Vars (wrangler.toml): REPO, BASE_BRANCH, ALLOWED_ORIGINS
import yaml from "js-yaml";
import { clubToYaml, slugify } from "../../lib/club.mjs";
import { extraChecks } from "../../lib/rules.mjs";

const MAX_BODY = 30_000;
const ACTIONS = new Set(["add", "edit", "confirm", "close"]);
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const LEVELS = ["any", "A1", "A2", "B1", "B2", "C1", "C2"];
const CONTACT_TYPES = ["telegram", "instagram", "facebook", "website", "meetup", "email", "phone", "youtube", "whatsapp", "viber", "discord", "other"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const cors = {
      "access-control-allow-origin": allowed.includes(origin) ? origin : allowed[0] || "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "origin",
    };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/suggest") return reply(404, { error: "not found" });
    if (allowed.length && !allowed.includes(origin)) return reply(403, { error: "origin not allowed" });

    const raw = await request.text();
    if (raw.length > MAX_BODY) return reply(413, { error: "too large" });
    let p;
    try { p = JSON.parse(raw); } catch { return reply(400, { error: "bad json" }); }

    if (env.TURNSTILE_SECRET) {
      const ok = await verifyTurnstile(p.turnstileToken, env.TURNSTILE_SECRET, request.headers.get("cf-connecting-ip"));
      if (!ok) return reply(403, { error: "captcha failed" });
    }

    try {
      const pr = await handle(p, env);
      return reply(200, { pr });
    } catch (e) {
      return reply(e.status || 500, { error: e.message });
    }
  },
};

class UserError extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

async function handle(p, env) {
  if (!ACTIONS.has(p.action)) throw new UserError("unknown action");
  const comment = str(p.comment, 1000) || "";
  const gh = github(env);
  const today = new Date().toISOString().slice(0, 10);

  let id, old = null, sha = null;
  if (p.action === "add") {
    const base = slugify(p.club?.name || "");
    id = base;
    for (let n = 2; await gh.fileSha(`data/clubs/${id}.yaml`); n++) id = `${base}-${n}`;
  } else {
    id = String(p.id || "");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) throw new UserError("bad id");
    const file = await gh.getFile(`data/clubs/${id}.yaml`);
    if (!file) throw new UserError("club not found", 404);
    sha = file.sha;
    old = yaml.load(file.text, { schema: yaml.JSON_SCHEMA });
  }

  let club;
  if (p.action === "add") {
    club = { ...sanitize(p.club), id, last_checked: today };
  } else if (p.action === "edit") {
    // Fields the form cannot change stay as they are in the repo.
    club = { ...sanitize(p.club), id, first_seen: old.first_seen, last_seen: old.last_seen, last_checked: old.last_checked, sources: old.sources };
  } else if (p.action === "confirm") {
    club = { ...old, last_checked: today, status: old.status === "closed" ? "closed" : "active" };
  } else {
    club = { ...old, status: "closed" };
  }
  if (!club.name || club.name.length < 2) throw new UserError("name is required");
  if (!club.languages?.length) throw new UserError("at least one language is required");
  const problems = extraChecks(club);
  if (problems.length) throw new UserError(problems.join(" "));

  const text = clubToYaml(club);
  const path = `data/clubs/${id}.yaml`;
  const branch = `suggest/${id}-${Date.now().toString(36)}`;
  const titles = { add: "Add", edit: "Edit", confirm: "Still running", close: "Mark closed" };
  const title = `${titles[p.action]}: ${club.name}`.slice(0, 200);

  await gh.createBranch(branch);
  await gh.putFile(path, text, `${title}\n\nSuggested through the site.`, branch, sha);
  const body = [
    `**Action:** ${p.action}`,
    `**File:** \`${path}\``,
    comment ? `**Visitor's note:**\n\n> ${comment.replace(/\n/g, "\n> ")}` : "_No note from the visitor._",
    "",
    "Merge to publish. Close to reject. Edit the file on this branch to fix details before merging.",
  ].join("\n\n");
  const pr = await gh.openPr(title, body, branch);
  await gh.addLabel(pr.number, "suggestion").catch(() => {});
  return pr.html_url;
}

// Copies only known fields, with types and lengths checked. CI validates the full schema on the PR.
function sanitize(c) {
  if (!c || typeof c !== "object") throw new UserError("missing club");
  const out = {
    name: str(c.name, 150),
    description: str(c.description, 2000),
    languages: arr(c.languages).map((x) => String(x).toLowerCase()).filter((x) => /^[a-z]{2,3}$/.test(x)).slice(0, 20),
    levels: arr(c.levels).filter((x) => LEVELS.includes(x)),
    format: ["offline", "online", "hybrid"].includes(c.format) ? c.format : undefined,
    location: c.location && {
      venue: str(c.location.venue, 200), address: str(c.location.address, 300),
      district: str(c.location.district, 100), metro: str(c.location.metro, 100),
    },
    schedule: arr(c.schedule).slice(0, 14).filter((s) => DAYS.includes(s?.day)).map((s) => ({
      day: s.day,
      time: /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(s.time) ? s.time : undefined,
      duration_min: Number.isInteger(s.duration_min) && s.duration_min >= 10 && s.duration_min <= 600 ? s.duration_min : undefined,
      frequency: ["weekly", "biweekly", "monthly", "irregular"].includes(s.frequency) ? s.frequency : undefined,
    })),
    schedule_note: str(c.schedule_note, 500),
    price: c.price && { free: typeof c.price.free === "boolean" ? c.price.free : undefined, amount: str(c.price.amount, 100) },
    registration: ["required", "optional", "none"].includes(c.registration) ? c.registration : undefined,
    contacts: arr(c.contacts).slice(0, 12).filter((x) => CONTACT_TYPES.includes(x?.type)).map((x) => ({
      type: x.type,
      url: x.access === "on_request" ? undefined : str(x.url, 500),
      access: ["invite", "on_request"].includes(x.access) ? x.access : undefined,
      note: str(x.note, 300),
    })).filter((x) => x.url || x.note),
    organizer: str(c.organizer, 200),
    status: ["active", "paused", "closed", "unknown"].includes(c.status) ? c.status : "active",
    notes: str(c.notes, 2000),
  };
  return out;
}

function str(v, max) {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();
  return s ? s.slice(0, max) : undefined;
}
const arr = (v) => (Array.isArray(v) ? v : []);

async function verifyTurnstile(token, secret, ip) {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = await res.json();
  return data.success === true;
}

function github(env) {
  const repo = env.REPO;
  const base = env.BASE_BRANCH || "main";
  const api = async (path, init = {}) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "kyiv-speaking-clubs-worker",
        "x-github-api-version": "2022-11-28",
        ...(init.body ? { "content-type": "application/json" } : {}),
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? {} : res.json();
  };
  const b64encode = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
  const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

  return {
    async fileSha(path) { return (await api(`/contents/${path}?ref=${base}`))?.sha || null; },
    async getFile(path) {
      const f = await api(`/contents/${path}?ref=${base}`);
      return f ? { sha: f.sha, text: b64decode(f.content) } : null;
    },
    async createBranch(name) {
      const ref = await api(`/git/ref/heads/${base}`);
      await api(`/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${name}`, sha: ref.object.sha }) });
    },
    async putFile(path, text, message, branch, sha) {
      await api(`/contents/${path}`, { method: "PUT", body: JSON.stringify({ message, content: b64encode(text), branch, ...(sha ? { sha } : {}) }) });
    },
    async openPr(title, body, head) {
      return api(`/pulls`, { method: "POST", body: JSON.stringify({ title, body, head, base }) });
    },
    async addLabel(number, label) {
      await api(`/issues/${number}/labels`, { method: "POST", body: JSON.stringify({ labels: [label] }) });
    },
  };
}
