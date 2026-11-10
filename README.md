# Kyiv Speaking Clubs

A list of language speaking clubs in Kyiv, current and historic. Visitors suggest changes on the site, and each suggestion becomes a pull request. Merging the pull request publishes the change.

## How it fits together

| Part | Where | What it does |
|---|---|---|
| Data | `data/clubs/<id>.yaml` | One YAML file per club. The file name equals `id`. |
| Schema | `schema/club.schema.json` | Field rules. `lib/rules.mjs` adds checks the schema cannot express. |
| Build | `scripts/build.mjs` | Validates every club file and writes `site/clubs.json` for the page. |
| Site | `site/` | Static page with filters and a suggestion form. No framework, no build step for the page itself. |
| Worker | `worker/` | Cloudflare Worker. It checks Turnstile, cleans the input and opens a pull request through the GitHub API. |
| CI | `.github/workflows/` | `validate.yml` checks every pull request. `deploy.yml` publishes `site/` to GitHub Pages on every push to `main`. |

## Run locally

```sh
npm install
npm run serve        # builds, then serves site/ at http://localhost:8080
npm run validate     # checks data/clubs/*.yaml only
```

## Club fields

```yaml
id: blabla-english-ua           # lowercase, digits, dashes; equals the file name
name: BlaBla English UA
description: Free English club with a new topic each week.
languages: [en]                 # ISO 639 codes: uk, en, de, crh, ukl (Ukrainian Sign Language)...
levels: [B1, B2]                # any, A1..C2
format: offline                 # offline | online | hybrid
location:
  venue: Coffee hub
  address: вул. Драгоманова, 1
  metro: Позняки
  note: 2nd floor, room 116, entrance from the yard   # how to find the club inside a big venue
  lat: 50.464612                # WGS84, Kyiv area only
  lon: 30.519411
  geocoded: true                # set when lat/lon came from the address automatically; remove after checking the dot
  near_metro: true              # set when the dot is the metro station, because the exact place is unknown
  map_url: https://maps.app.goo.gl/...   # optional; without it the site links to Google Maps by lat/lon or address
schedule:
  - day: sat                    # mon..sun
    time: "12:00"
    duration_min: 90
    frequency: weekly           # weekly | biweekly | monthly | irregular
schedule_note: Every Saturday, sometimes skipped in summer
price:
  free: true
  amount: "150 грн"
registration: required          # required | optional | none
contacts:
  - type: telegram
    url: https://t.me/blablaenglishua
  - type: telegram              # private group: no link, only how to get in
    access: on_request
    note: Write to @club_admin for an invite
organizer: BlaBla English UA    # a public name or an organization, never a private phone number
status: active                  # active | paused | closed | unknown
first_seen: "2019-03"           # earliest evidence the club existed (YYYY, YYYY-MM or YYYY-MM-DD)
last_seen: "2025-06-25"         # latest evidence found online
last_checked: "2026-11-10"      # latest date a person confirmed it still meets
sources: [https://...]
notes: ...
```

### How the page shows status

- `closed` and `paused` are shown as they are.
- Otherwise the page takes the newer of `last_seen` and `last_checked`. Within 6 months, the club shows as active. After 6 months, it shows as "not confirmed" (if `status: active`) or "unknown".
- Clubs that are closed, or that nobody has seen for 12 months, are hidden until the visitor ticks "Show old and closed".

### Private groups and invite links

Admins of private Telegram, WhatsApp, Viber or Discord groups often do not want the invite link on a public page. A pull request on a public repo is public too. So:

- `access: on_request` publishes no link. `note` says how to get in, for example "write to @admin" or "ask at the meeting".
- `access: invite` publishes the invite link. Use it only when the admins agreed.
- An invite link (`t.me/+…`, `t.me/joinchat/…`, `chat.whatsapp.com/…`, `invite.viber.com`, `discord.gg/…`) without `access: invite` fails the build, the form and the Worker.

## Deploy

1. Create the GitHub repo `zbstof/kyiv-speaking-clubs` and push. In Settings → Pages, set the source to "GitHub Actions". Create the label `suggestion`.
2. Create a fine-grained GitHub token limited to this one repo, with read/write access to Contents, Pull requests and Issues.
3. Create a Turnstile widget in the Cloudflare dashboard for `zbstof.github.io`. Note the site key and the secret.
4. Deploy the Worker:
   ```sh
   cd worker
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler deploy
   ```
5. Put the Worker URL and the Turnstile site key into `site/config.js`, then push.

Until step 5 is done, the form opens a pre-filled GitHub issue instead. That fallback needs the visitor to have a GitHub account.

## Moderating

- Each suggestion arrives as a pull request labelled `suggestion`, with the visitor's note in the description.
- CI validates the changed file. Fix details by editing the file on the pull request branch.
- Merge to publish. Close to reject.

## Bulk import

`node scripts/import-research.mjs a.yaml b.yaml` reads lists of research records, merges records with the same name and writes new club files. Existing files are kept unless you pass `--force`. Research records use the club fields above, plus `status_guess` (`active` | `likely_closed` | `unknown`) instead of `status`.

`node scripts/merge-clubs.mjs <keep-id> <dup-id>... [--id new-id]` merges duplicate club files into one. It keeps the first club's fields, fills gaps from the others, joins languages, contacts and sources, and deletes the duplicates.

## Map and coordinates

- The "Мапа" tab shows every club with `lat`/`lon` that is not online-only, using Leaflet and OpenStreetMap tiles.
- **Colors:** pins are colored by the club's first language. Ukrainian is blue, English orange, German aqua, and all other languages gray. More colors could not be told apart on a map, according to the dataviz palette check. Each pin also shows the language code, so nobody has to rely on color alone.
- **Bulk geocoding:** `node scripts/geocode.mjs [id...]` fills missing coordinates from the address through OpenStreetMap Nominatim, at 1 request per second, and marks each result `geocoded: true`.
  - Street-only matches are rejected: on a long street, the street's middle can be kilometers off.
  - The venue name is used only when there is no address, because chain venues match the wrong branch.
  - **Station fallback:** when neither address nor venue gives a match, the dot goes on the metro station from `metro`, marked `near_metro: true`. The map draws it with a dashed outline and says the exact place is unknown. Stations come from `lib/metro.mjs`: 53 Kyiv stations from OpenStreetMap, with Ukrainian, English, Russian and old names, so «Дружби народів» finds Звіринецька.
- **New suggestions:** the Worker reads coordinates from a pasted map link (it also follows `maps.app.goo.gl` short links). Without a link, it geocodes the address.

## Spam protection

- The Worker accepts at most 5 suggestions per minute from one IP address (Workers rate limiting binding `LIMITER` in `worker/wrangler.toml`).
- Turnstile is checked only when `TURNSTILE_SECRET` is set on the Worker and `turnstileSiteKey` is set in `site/config.js`.
- Nothing is published without a merge, so spam costs you closing pull requests, not a broken page.
