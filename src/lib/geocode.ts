export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

// Bias results toward the US, including Alaska and Hawaii. [minLon,minLat,maxLon,maxLat]
const US_BBOX = '-170,17,-66,72';

/** Network/timeout failures throw this so callers can offer a retry. */
export class GeocodeError extends Error {}

/**
 * Free, key-less forward geocoding via Photon (komoot). CORS-friendly, no
 * account needed. Results are filtered to the US.
 *
 * Resolves to `[]` when there are simply no matches. Throws `GeocodeError` on a
 * network failure or timeout (8s), so the caller can distinguish "no results"
 * from "couldn't reach the service" and offer a retry. A caller-triggered abort
 * (typing a newer query) rejects with the usual `AbortError`.
 */
export async function geocode(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=${US_BBOX}`;

  // Internal timeout, chained to the caller's signal if provided.
  const timeoutCtrl = new AbortController();
  const timer = setTimeout(() => timeoutCtrl.abort(), 8000);
  const onAbort = () => timeoutCtrl.abort();
  if (signal) {
    if (signal.aborted) timeoutCtrl.abort();
    else signal.addEventListener('abort', onAbort);
  }

  try {
    const res = await fetch(url, { signal: timeoutCtrl.signal });
    if (!res.ok) throw new GeocodeError(`Geocode failed: ${res.status}`);
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
  } catch (err) {
    // Re-throw caller aborts untouched; everything else is a service failure.
    if (signal?.aborted) throw err;
    throw new GeocodeError('Could not reach the location service.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
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
