// Transforms real OpenStreetMap advertising locations (scripts/osm-raw.json)
// into typed Listing entries. Coordinates, state and format are real (from OSM);
// reach/dimensions/pricing are deterministic estimates derived from the
// coordinates so rebuilds are stable. Run: node scripts/gen-listings.mjs
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

// Per-format presentation. reach scales the tier DEC (a poster sees fewer eyes
// than a highway bulletin); sizes are sampled deterministically.
const FORMAT_META = {
  static_billboard: {
    label: 'Billboard',
    reach: 1,
    sizes: ['14ft × 48ft', '12ft × 24ft', '10ft 5in × 22ft 8in'],
    digital: false,
    litChance: 0.7,
  },
  digital_billboard: {
    label: 'Digital Billboard',
    reach: 1,
    sizes: ['14ft × 48ft LED', '12ft × 40ft LED', '10ft × 36ft LED'],
    digital: true,
    litChance: 1,
  },
  transit_shelter: {
    label: 'Transit Shelter',
    reach: 0.4,
    sizes: ['46in × 67in (backlit)'],
    digital: false,
    litChance: 1,
  },
  mall_poster: {
    label: 'Poster Panel',
    reach: 0.35,
    sizes: ['40in × 60in', '67in × 47in'],
    digital: false,
    litChance: 0.2,
  },
};

const cityCount = {};
const listings = nodes.map((n, i) => {
  const fmt = n.format && FORMAT_META[n.format] ? n.format : 'static_billboard';
  const meta = FORMAT_META[fmt];
  const seed = `${n.lat},${n.lng}`;
  const r1 = rand(seed);
  const r2 = rand(seed + 'x');
  const [lo, hi] = DEC_RANGE[n.tier] ?? DEC_RANGE.mid;
  const dec = Math.max(1000, Math.round(((lo + r1 * (hi - lo)) * meta.reach) / 1000) * 1000);
  const dimensions = meta.sizes[Math.floor(r2 * meta.sizes.length)];
  const illuminated = meta.digital ? true : rand(seed + 'i') < meta.litChance;

  const key = `${n.city}|${n.state}|${fmt}`;
  cityCount[key] = (cityCount[key] ?? 0) + 1;
  const k = cityCount[key];
  const title = k > 1 ? `${n.city} ${meta.label} #${k}` : `${n.city} ${meta.label}`;

  const listing = {
    id: `osm-${i + 1}`,
    title,
    format: fmt,
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
    description: `${meta.label} in ${n.city}, ${n.state}. Location is real (OpenStreetMap); audience reach and pricing are illustrative estimates.`,
  };
  if (meta.digital) listing.digital = true;
  return listing;
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
    ];
    if (l.digital) parts.push('digital: true');
    parts.push(`minWeeks: ${l.minWeeks}`);
    parts.push(`vendorLabel: '${esc(l.vendorLabel)}'`);
    parts.push(`description: '${esc(l.description)}'`);
    return `  { ${parts.join(', ')} },`;
  })
  .join('\n');

const out = `// AUTO-GENERATED from real OpenStreetMap advertising locations (scripts/gen-listings.mjs).
// Coordinates, state and format are real; reach and pricing are illustrative estimates. Do not edit by hand.
import type { Listing } from './types';

export const GENERATED_LISTINGS: Listing[] = [
${body}
];
`;

writeFileSync(new URL('../src/data/generated-listings.ts', import.meta.url), out);
const states = [...new Set(listings.map((l) => l.state))].sort();
const fmtCount = {};
for (const l of listings) fmtCount[l.format] = (fmtCount[l.format] || 0) + 1;
console.log(`wrote ${listings.length} listings across ${states.length} states/territories`);
console.log('formats:', JSON.stringify(fmtCount));
console.log(states.join(', '));
