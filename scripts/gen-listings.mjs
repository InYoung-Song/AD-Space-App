// Transforms real OpenStreetMap billboard coordinates (scripts/osm-raw.json)
// into typed Listing entries. Reach/dimensions are deterministic estimates
// derived from the coordinates so rebuilds are stable. Run: node scripts/gen-listings.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const raw = readFileSync(new URL('./osm-raw.json', import.meta.url), 'utf8').replace(/^﻿/, '');
const nodes = JSON.parse(raw);

function rand(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const DEC_RANGE = {
  metro: [90000, 260000],
  major: [60000, 170000],
  mid: [35000, 110000],
  small: [18000, 60000],
};
const SIZES = ['14ft × 48ft', '12ft × 24ft', '10ft 5in × 22ft 8in'];

const cityCount = {};
const listings = nodes.map((n, i) => {
  const seed = `${n.lat},${n.lng}`;
  const r1 = rand(seed);
  const r2 = rand(seed + 'x');
  const [lo, hi] = DEC_RANGE[n.tier] ?? DEC_RANGE.mid;
  const dec = Math.round((lo + r1 * (hi - lo)) / 1000) * 1000;
  const dimensions = SIZES[Math.floor(r2 * SIZES.length)];
  const illuminated = rand(seed + 'i') > 0.25;

  const key = `${n.city}|${n.state}`;
  cityCount[key] = (cityCount[key] ?? 0) + 1;
  const k = cityCount[key];
  const title = k > 1 ? `${n.city} Billboard #${k}` : `${n.city} Billboard`;

  return {
    id: `osm-${i + 1}`,
    title,
    format: 'static_billboard',
    lat: n.lat,
    lng: n.lng,
    address: `${n.city}, ${n.state}`,
    city: n.city,
    state: n.state,
    marketTier: n.tier,
    dec,
    dimensions,
    illuminated,
    minWeeks: 4,
    vendorLabel: 'Location via OpenStreetMap',
    description: `Roadside billboard structure in ${n.city}, ${n.state}. Location is real (OpenStreetMap); audience reach and pricing are illustrative estimates.`,
  };
});

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const body = listings
  .map((l) => {
    const parts = [
      `id: '${l.id}'`,
      `title: '${esc(l.title)}'`,
      `format: '${l.format}'`,
      `lat: ${l.lat}`,
      `lng: ${l.lng}`,
      `address: '${esc(l.address)}'`,
      `city: '${esc(l.city)}'`,
      `state: '${l.state}'`,
      `marketTier: '${l.marketTier}'`,
      `dec: ${l.dec}`,
      `dimensions: '${esc(l.dimensions)}'`,
      `illuminated: ${l.illuminated}`,
      `minWeeks: ${l.minWeeks}`,
      `vendorLabel: '${esc(l.vendorLabel)}'`,
      `description: '${esc(l.description)}'`,
    ];
    return `  { ${parts.join(', ')} },`;
  })
  .join('\n');

const out = `// AUTO-GENERATED from real OpenStreetMap billboard locations (scripts/gen-listings.mjs).
// Coordinates are real; reach and pricing are illustrative estimates. Do not edit by hand.
import type { Listing } from './types';

export const GENERATED_LISTINGS: Listing[] = [
${body}
];
`;

writeFileSync(new URL('../src/data/generated-listings.ts', import.meta.url), out);
const states = [...new Set(listings.map((l) => l.state))].sort();
console.log(`wrote ${listings.length} listings across ${states.length} states/territories`);
console.log(states.join(', '));
