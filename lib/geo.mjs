// Address -> coordinates through OpenStreetMap Nominatim. Used by scripts/geocode.mjs and the worker.
// Nominatim policy: at most 1 request per second, and a User-Agent that names the app.
// https://operations.osmfoundation.org/policies/nominatim/

import { findStation } from "./metro.mjs";

export const USER_AGENT = "kyiv-speaking-clubs/1.0 (+https://github.com/zbstof/kyiv-speaking-clubs)";
// Kyiv and the nearest suburbs: left, top, right, bottom.
const VIEWBOX = "30.20,50.62,30.85,50.20";

// Strips parts of an address that confuse the geocoder: offices, floors, rooms, notes in brackets,
// second addresses after ";", postcodes.
export function cleanAddress(text) {
  if (!text) return "";
  // \b and \w only know Latin letters, so word edges are spelled out with \p{L}/\p{N} and the u flag.
  const edge = "(?<=^|[\\s,])";
  return text
    .split(";")[0]
    .replace(/\([^)]*\)/g, " ")
    .replace(/[«»"„“”]/g, "")
    // A keyword must end the word ("ауд." yes, "Аудиторна" no); then an optional "№" and the number.
    .replace(new RegExp(edge + "(офіс|оф\\.|office|кімната|кімн\\.|кімн|room|ауд\\.|ауд|корпус|корп\\.|корп|building)(?![\\p{L}])\\s*(№\\s*)?[\\p{L}\\p{N}\\-–/]*", "giu"), " ")
    .replace(new RegExp(edge + "\\d+(-?й)?\\s*(поверх|floor)(?![\\p{L}])|" + edge + "(поверх|floor)\\s*\\d+", "giu"), " ")
    .replace(/(?<![\p{N}])\d{5}(?![\p{N}])/gu, " ")
    .replace(new RegExp(edge + "(м\\.\\s*)?(Київ|Kyiv|Kiev|Киев)(?=$|[\\s,])", "giu"), " ")
    .replace(/(\p{N})-(\p{L})(?![\p{L}])/gu, "$1$2") // "1-Б" -> "1Б", the form OpenStreetMap uses
    .replace(/(\s*,)+/g, ",").replace(/\s{2,}/g, " ").replace(/^[,\s]+|[,\s]+$/g, "");
}

async function search(q, fetchImpl) {
  const url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
    q, format: "jsonv2", limit: "1", countrycodes: "ua", viewbox: VIEWBOX, bounded: "1", "accept-language": "uk",
  });
  const res = await fetchImpl(url, { headers: { "user-agent": USER_AGENT, "accept-language": "uk" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const [hit] = await res.json();
  // A match on the whole street ("вулиця Хрещатик") puts the dot at the street's middle,
  // which on a long street is kilometres off. Only buildings, places and amenities count.
  if (hit && (hit.category === "highway" || ["road", "suburb", "quarter", "neighbourhood", "city_district", "borough", "city"].includes(hit.addresstype))) return null;
  return hit ?{ lat: Math.round(+hit.lat * 1e6) / 1e6, lon: Math.round(+hit.lon * 1e6) / 1e6, match: hit.display_name } : null;
}

// Looks up the cleaned address. Falls back to the venue name only when there is no address:
// chain venues ("Пузата Хата") match the wrong branch, and a wrong dot is worse than none.
// Last resort: the metro station named in location.metro (result has nearMetro: true).
// Returns {lat, lon, match, query, nearMetro?} or null.
// `wait` is called between requests so callers can respect the 1 request/second limit.
export async function geocode(location, { fetchImpl = fetch, wait = () => new Promise((r) => setTimeout(r, 1100)) } = {}) {
  const queries = [];
  const addr = cleanAddress(location?.address);
  if (addr) queries.push(`${addr}, Київ`);
  const venue = cleanAddress(location?.venue);
  if (!addr && venue && !/online|онлайн|zoom/i.test(venue)) queries.push(`${venue}, Київ`);
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await wait();
    const hit = await search(queries[i], fetchImpl);
    if (hit) return { ...hit, query: queries[i] };
  }
  const st = findStation(location?.metro);
  if (st) return { lat: st.lat, lon: st.lon, match: `метро ${st.name}`, query: `metro: ${location.metro}`, nearMetro: true };
  return null;
}

// Reads coordinates out of a full Google Maps (or OpenStreetMap) link. Returns {lat, lon} or null.
// site/app.js has a copy of this function; keep the two in sync.
// The place pin (!3d…!4d…) beats the map centre (@lat,lon), which is only where the view was.
export function coordsFromMapUrl(url) {
  if (!url) return null;
  const pats = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|destination|center)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&]mlat=(-?\d{1,2}\.\d+)&mlon=(-?\d{1,3}\.\d+)/,
    /#map=\d+\/(-?\d{1,2}\.\d+)\/(-?\d{1,3}\.\d+)/,
  ];
  for (const p of pats) {
    const m = url.match(p);
    if (m) return { lat: +m[1], lon: +m[2] };
  }
  return null;
}

// Short links (maps.app.goo.gl/…) hide the coordinates behind redirects; follow them server-side.
export async function resolveShortMapUrl(url, fetchImpl = fetch) {
  if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//.test(url)) return url;
  let current = url;
  for (let i = 0; i < 5; i++) {
    const res = await fetchImpl(current, { redirect: "manual", headers: { "user-agent": USER_AGENT } });
    const next = res.headers.get("location");
    if (!next) break;
    current = new URL(next, current).toString();
    if (coordsFromMapUrl(current)) break;
  }
  return current;
}
