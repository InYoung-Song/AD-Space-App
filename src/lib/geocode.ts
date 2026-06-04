export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

// Bias results toward the continental US. [minLon,minLat,maxLon,maxLat]
const US_BBOX = '-125,24,-66,49.5';

/**
 * Free, key-less forward geocoding via Photon (komoot). CORS-friendly, no
 * account needed. Results are filtered to the US.
 */
export async function geocode(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=${US_BBOX}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = (await res.json()) as { features?: GeoFeature[] };
    return (json.features ?? [])
      .filter((f) => f.properties?.countrycode === 'US' && Array.isArray(f.geometry?.coordinates))
      .map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties;
        const label =
          [p.name, p.city ?? p.county, p.state].filter(Boolean).join(', ') || p.name || 'Result';
        return { label, lat, lng };
      });
  } catch {
    return [];
  }
}

interface GeoFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    county?: string;
    state?: string;
    countrycode?: string;
  };
}
