// Fetches REAL advertising structures from OpenStreetMap (Overpass API) for all
// 50 states + DC, and writes scripts/osm-raw.json. Only real mapped features are
// kept — nothing is fabricated. Reach/pricing remain illustrative estimates
// (added later by gen-listings.mjs) and are disclosed in the app.
//
//   node scripts/fetch-osm.mjs
//
// Each kept node: { lat, lng, city, state, tier, format }. City is the nearest
// known city in the same state; format is mapped from the OSM advertising type.
import { readFileSync, writeFileSync } from 'node:fs';

// OSM advertising values we treat as bookable "ad spaces", mapped to app formats.
const TYPE_TO_FORMAT = {
  billboard: 'static_billboard',
  screen: 'digital_billboard',
  totem: 'digital_billboard',
  board: 'mall_poster',
  column: 'mall_poster',
  poster_box: 'transit_shelter',
  wall_painting: 'static_billboard',
};
const TYPES = Object.keys(TYPE_TO_FORMAT);

// Nearest-city labeling table. [city, state, lat, lng, tier]. Every state has at
// least two entries so an in-state nearest city always resolves.
const CITIES = [
  // metros
  ['New York', 'NY', 40.7128, -74.006, 'metro'],
  ['Los Angeles', 'CA', 34.0522, -118.2437, 'metro'],
  ['Chicago', 'IL', 41.8781, -87.6298, 'metro'],
  ['Houston', 'TX', 29.7604, -95.3698, 'metro'],
  ['Dallas', 'TX', 32.7767, -96.797, 'metro'],
  ['San Antonio', 'TX', 29.4241, -98.4936, 'metro'],
  ['Phoenix', 'AZ', 33.4484, -112.074, 'metro'],
  ['Philadelphia', 'PA', 39.9526, -75.1652, 'metro'],
  ['San Diego', 'CA', 32.7157, -117.1611, 'metro'],
  ['San Jose', 'CA', 37.3382, -121.8863, 'metro'],
  ['San Francisco', 'CA', 37.7749, -122.4194, 'metro'],
  ['Miami', 'FL', 25.7617, -80.1918, 'metro'],
  ['Atlanta', 'GA', 33.749, -84.388, 'metro'],
  ['Boston', 'MA', 42.3601, -71.0589, 'metro'],
  ['Seattle', 'WA', 47.6062, -122.3321, 'metro'],
  ['Washington', 'DC', 38.9072, -77.0369, 'metro'],
  // major
  ['Austin', 'TX', 30.2672, -97.7431, 'major'],
  ['Fort Worth', 'TX', 32.7555, -97.3308, 'major'],
  ['El Paso', 'TX', 31.7619, -106.485, 'major'],
  ['Jacksonville', 'FL', 30.3322, -81.6557, 'major'],
  ['Orlando', 'FL', 28.5383, -81.3792, 'major'],
  ['Tampa', 'FL', 27.9506, -82.4572, 'major'],
  ['Columbus', 'OH', 39.9612, -82.9988, 'major'],
  ['Cleveland', 'OH', 41.4993, -81.6944, 'major'],
  ['Cincinnati', 'OH', 39.1031, -84.512, 'major'],
  ['Charlotte', 'NC', 35.2271, -80.8431, 'major'],
  ['Raleigh', 'NC', 35.7796, -78.6382, 'major'],
  ['Indianapolis', 'IN', 39.7684, -86.1581, 'major'],
  ['Denver', 'CO', 39.7392, -104.9903, 'major'],
  ['Nashville', 'TN', 36.1627, -86.7816, 'major'],
  ['Memphis', 'TN', 35.1495, -90.049, 'major'],
  ['Detroit', 'MI', 42.3314, -83.0458, 'major'],
  ['Portland', 'OR', 45.5152, -122.6784, 'major'],
  ['Las Vegas', 'NV', 36.1699, -115.1398, 'major'],
  ['Louisville', 'KY', 38.2527, -85.7585, 'major'],
  ['Baltimore', 'MD', 39.2904, -76.6122, 'major'],
  ['Milwaukee', 'WI', 43.0389, -87.9065, 'major'],
  ['Albuquerque', 'NM', 35.0844, -106.6504, 'major'],
  ['Tucson', 'AZ', 32.2226, -110.9747, 'major'],
  ['Sacramento', 'CA', 38.5816, -121.4944, 'major'],
  ['Fresno', 'CA', 36.7378, -119.7871, 'major'],
  ['Kansas City', 'MO', 39.0997, -94.5786, 'major'],
  ['St. Louis', 'MO', 38.627, -90.1994, 'major'],
  ['Omaha', 'NE', 41.2565, -95.9345, 'major'],
  ['Minneapolis', 'MN', 44.9778, -93.265, 'major'],
  ['Pittsburgh', 'PA', 40.4406, -79.9959, 'major'],
  ['Salt Lake City', 'UT', 40.7608, -111.891, 'major'],
  ['Oklahoma City', 'OK', 35.4676, -97.5164, 'major'],
  ['New Orleans', 'LA', 29.9511, -90.0715, 'major'],
  ['Richmond', 'VA', 37.5407, -77.436, 'major'],
  ['Virginia Beach', 'VA', 36.8529, -75.978, 'major'],
  ['Buffalo', 'NY', 42.8864, -78.8784, 'major'],
  ['Birmingham', 'AL', 33.5186, -86.8104, 'major'],
  // mid / small — ensures every state resolves
  ['Mobile', 'AL', 30.6954, -88.0399, 'mid'],
  ['Montgomery', 'AL', 32.3668, -86.3, 'mid'],
  ['Anchorage', 'AK', 61.2181, -149.9003, 'mid'],
  ['Fairbanks', 'AK', 64.8378, -147.7164, 'small'],
  ['Mesa', 'AZ', 33.4152, -111.8315, 'major'],
  ['Little Rock', 'AR', 34.7465, -92.2896, 'mid'],
  ['Fayetteville', 'AR', 36.0626, -94.1574, 'small'],
  ['Long Beach', 'CA', 33.7701, -118.1937, 'major'],
  ['Oakland', 'CA', 37.8044, -122.2712, 'major'],
  ['Colorado Springs', 'CO', 38.8339, -104.8214, 'mid'],
  ['Boulder', 'CO', 40.015, -105.2705, 'mid'],
  ['Hartford', 'CT', 41.7658, -72.6734, 'mid'],
  ['New Haven', 'CT', 41.3083, -72.9279, 'mid'],
  ['Bridgeport', 'CT', 41.1865, -73.1952, 'mid'],
  ['Wilmington', 'DE', 39.7391, -75.5398, 'mid'],
  ['Dover', 'DE', 39.1582, -75.5244, 'small'],
  ['Tallahassee', 'FL', 30.4383, -84.2807, 'mid'],
  ['Savannah', 'GA', 32.0809, -81.0912, 'mid'],
  ['Augusta', 'GA', 33.4735, -82.0105, 'mid'],
  ['Honolulu', 'HI', 21.3069, -157.8583, 'major'],
  ['Hilo', 'HI', 19.7297, -155.09, 'small'],
  ['Boise', 'ID', 43.615, -116.2023, 'mid'],
  ['Idaho Falls', 'ID', 43.4917, -112.0339, 'small'],
  ['Springfield', 'IL', 39.7817, -89.6501, 'mid'],
  ['Peoria', 'IL', 40.6936, -89.589, 'mid'],
  ['Fort Wayne', 'IN', 41.0793, -85.1394, 'mid'],
  ['Des Moines', 'IA', 41.5868, -93.625, 'mid'],
  ['Cedar Rapids', 'IA', 41.9779, -91.6656, 'small'],
  ['Wichita', 'KS', 37.6872, -97.3301, 'mid'],
  ['Topeka', 'KS', 39.0473, -95.6752, 'small'],
  ['Lexington', 'KY', 38.0406, -84.5037, 'mid'],
  ['Baton Rouge', 'LA', 30.4515, -91.1871, 'mid'],
  ['Shreveport', 'LA', 32.5252, -93.7502, 'mid'],
  ['Portland', 'ME', 43.6591, -70.2568, 'mid'],
  ['Bangor', 'ME', 44.8016, -68.7712, 'small'],
  ['Annapolis', 'MD', 38.9784, -76.4922, 'small'],
  ['Worcester', 'MA', 42.2626, -71.8023, 'mid'],
  ['Springfield', 'MA', 42.1015, -72.5898, 'mid'],
  ['Grand Rapids', 'MI', 42.9634, -85.6681, 'mid'],
  ['Lansing', 'MI', 42.7325, -84.5555, 'mid'],
  ['Duluth', 'MN', 46.7867, -92.1005, 'small'],
  ['Jackson', 'MS', 32.2988, -90.1848, 'mid'],
  ['Gulfport', 'MS', 30.3674, -89.0928, 'small'],
  ['Springfield', 'MO', 37.2089, -93.2923, 'mid'],
  ['Billings', 'MT', 45.7833, -108.5007, 'small'],
  ['Missoula', 'MT', 46.8721, -113.994, 'small'],
  ['Lincoln', 'NE', 40.8136, -96.7026, 'mid'],
  ['Reno', 'NV', 39.5296, -119.8138, 'mid'],
  ['Manchester', 'NH', 42.9956, -71.4548, 'mid'],
  ['Concord', 'NH', 43.2081, -71.5376, 'small'],
  ['Newark', 'NJ', 40.7357, -74.1724, 'major'],
  ['Jersey City', 'NJ', 40.7178, -74.0431, 'major'],
  ['Atlantic City', 'NJ', 39.3643, -74.4229, 'mid'],
  ['Santa Fe', 'NM', 35.687, -105.9378, 'small'],
  ['Las Cruces', 'NM', 32.3199, -106.7637, 'small'],
  ['Albany', 'NY', 42.6526, -73.7562, 'mid'],
  ['Rochester', 'NY', 43.1566, -77.6088, 'mid'],
  ['Syracuse', 'NY', 43.0481, -76.1474, 'mid'],
  ['Greensboro', 'NC', 36.0726, -79.792, 'mid'],
  ['Fargo', 'ND', 46.8772, -96.7898, 'small'],
  ['Bismarck', 'ND', 46.8083, -100.7837, 'small'],
  ['Toledo', 'OH', 41.6528, -83.5379, 'mid'],
  ['Tulsa', 'OK', 36.154, -95.9928, 'mid'],
  ['Eugene', 'OR', 44.0521, -123.0868, 'mid'],
  ['Salem', 'OR', 44.9429, -123.0351, 'mid'],
  ['Harrisburg', 'PA', 40.2732, -76.8867, 'mid'],
  ['Providence', 'RI', 41.824, -71.4128, 'mid'],
  ['Warwick', 'RI', 41.7001, -71.4162, 'small'],
  ['Columbia', 'SC', 34.0007, -81.0348, 'mid'],
  ['Charleston', 'SC', 32.7765, -79.9311, 'mid'],
  ['Greenville', 'SC', 34.8526, -82.394, 'mid'],
  ['Sioux Falls', 'SD', 43.5446, -96.7311, 'small'],
  ['Rapid City', 'SD', 44.0805, -103.231, 'small'],
  ['Knoxville', 'TN', 35.9606, -83.9207, 'mid'],
  ['Chattanooga', 'TN', 35.0456, -85.3097, 'mid'],
  ['Provo', 'UT', 40.2338, -111.6585, 'mid'],
  ['Burlington', 'VT', 44.4759, -73.2121, 'small'],
  ['Montpelier', 'VT', 44.2601, -72.5754, 'small'],
  ['Norfolk', 'VA', 36.8508, -76.2859, 'major'],
  ['Arlington', 'VA', 38.8816, -77.0910, 'major'],
  ['Spokane', 'WA', 47.6588, -117.426, 'mid'],
  ['Tacoma', 'WA', 47.2529, -122.4443, 'mid'],
  ['Charleston', 'WV', 38.3498, -81.6326, 'small'],
  ['Huntington', 'WV', 38.4192, -82.4452, 'small'],
  ['Madison', 'WI', 43.0731, -89.4012, 'mid'],
  ['Green Bay', 'WI', 44.5133, -88.0133, 'small'],
  ['Cheyenne', 'WY', 41.14, -104.8202, 'small'],
  ['Casper', 'WY', 42.8666, -106.3131, 'small'],
];

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const STATE_CAP = 70;
const CITY_CAP = 24;
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversine(aLat, aLng, bLat, bLng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(s)); // km
}

function nearestCity(lat, lng, state) {
  let best = null;
  let bestD = Infinity;
  for (const c of CITIES) {
    if (c[1] !== state) continue;
    const d = haversine(lat, lng, c[2], c[3]);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best; // [city, state, lat, lng, tier] or null
}

function query(iso) {
  const t = TYPES.join('|');
  return `[out:json][timeout:120];area['ISO3166-2'='US-${iso}']->.a;(node['advertising'~'^(${t})$'](area.a);way['advertising'~'^(${t})$'](area.a););out center tags 1200;`;
}

async function fetchState(iso) {
  for (let i = 0; i < 5; i++) {
    const ep = ENDPOINTS[i % ENDPOINTS.length];
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ad-space-app/1.0 (data refresh; inyoungsong2@gmail.com)',
          Accept: 'application/json',
        },
        body: 'data=' + encodeURIComponent(query(iso)),
      });
      if (res.ok) return await res.json();
      if ([429, 502, 503, 504].includes(res.status)) {
        await sleep(4000 * (i + 1));
        continue;
      }
      return { error: `HTTP ${res.status}` };
    } catch (e) {
      await sleep(3000 * (i + 1));
    }
  }
  return { error: 'exhausted retries' };
}

// Round-robin across formats so a flood of billboards doesn't crowd out variety.
function interleaveByFormat(arr) {
  const byF = new Map();
  for (const n of arr) {
    const b = byF.get(n.format);
    if (b) b.push(n);
    else byF.set(n.format, [n]);
  }
  const keys = [...byF.keys()];
  const out = [];
  for (let depth = 0, prog = true; prog; depth++) {
    prog = false;
    for (const k of keys) {
      const a = byF.get(k);
      if (a[depth]) {
        out.push(a[depth]);
        prog = true;
      }
    }
  }
  return out;
}

// Balanced pick: round-robin across cities (each interleaved by format).
function pickBalanced(nodes) {
  const cities = new Map();
  for (const n of nodes) {
    const b = cities.get(n.city);
    if (b) b.push(n);
    else cities.set(n.city, [n]);
  }
  for (const [c, arr] of cities) cities.set(c, interleaveByFormat(arr));
  const out = [];
  for (let depth = 0, prog = true; out.length < STATE_CAP && prog; depth++) {
    prog = false;
    for (const [, arr] of cities) {
      if (depth < CITY_CAP && arr[depth]) {
        out.push(arr[depth]);
        prog = true;
        if (out.length >= STATE_CAP) break;
      }
    }
  }
  return out;
}

function coordOf(e) {
  if (typeof e.lat === 'number') return [e.lat, e.lon];
  if (e.center) return [e.center.lat, e.center.lon];
  return null;
}

async function main() {
  // Existing data is the fallback for any state whose fetch fails — we never regress.
  let existing = [];
  try {
    existing = JSON.parse(readFileSync(new URL('./osm-raw.json', import.meta.url), 'utf8').replace(/^﻿/, ''));
  } catch {
    /* none yet */
  }
  const existingByState = new Map();
  for (const n of existing) {
    const arr = existingByState.get(n.state);
    if (arr) arr.push(n);
    else existingByState.set(n.state, [n]);
  }

  const all = [];
  for (const iso of STATES) {
    const j = await fetchState(iso);
    if (j.error) {
      const fallback = existingByState.get(iso) ?? [];
      all.push(...fallback);
      console.log(`${iso}: FETCH FAILED (${j.error}) — kept ${fallback.length} existing`);
      await sleep(2500);
      continue;
    }
    const seen = new Set();
    const nodes = [];
    for (const e of j.elements ?? []) {
      const c = coordOf(e);
      if (!c) continue;
      const [lat, lng] = c;
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const adv = e.tags?.advertising;
      const format = TYPE_TO_FORMAT[adv] ?? 'static_billboard';
      const city = e.tags?.['addr:city'];
      const near = nearestCity(lat, lng, iso);
      if (!near && !city) continue; // can't credibly label — skip
      nodes.push({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        city: city || near[0],
        state: iso,
        tier: near ? near[4] : 'mid',
        format,
      });
    }
    const picked = pickBalanced(nodes);
    // If OSM genuinely had nothing usable, fall back to existing for this state.
    const final = picked.length ? picked : existingByState.get(iso) ?? [];
    all.push(...final);
    console.log(`${iso}: ${j.elements?.length ?? 0} raw -> ${nodes.length} usable -> kept ${final.length}`);
    await sleep(2500);
  }

  writeFileSync(new URL('./osm-raw.json', import.meta.url), JSON.stringify(all));
  const byState = {};
  for (const n of all) byState[n.state] = (byState[n.state] || 0) + 1;
  console.log(`\nWROTE ${all.length} nodes across ${Object.keys(byState).length} states/DC`);
}

main();
