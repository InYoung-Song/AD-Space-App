import type { Listing } from '@/data/types';
import { quickMonthly } from '@/lib/estimator';
import type { Filters } from '@/lib/store';

/** Pure filter used by both the map and the browse list. */
export function filterListings(listings: Listing[], f: Filters): Listing[] {
  const q = f.query.trim().toLowerCase();
  return listings.filter((l) => {
    if (f.formats.length && !f.formats.includes(l.format)) return false;
    if (f.markets.length && !f.markets.includes(l.marketTier)) return false;
    if (f.maxMonthly != null && quickMonthly(l) > f.maxMonthly) return false;
    if (q) {
      const hay = `${l.title} ${l.city} ${l.state} ${l.address}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function activeFilterCount(f: Filters): number {
  return (
    f.formats.length +
    f.markets.length +
    (f.maxMonthly != null ? 1 : 0) +
    (f.query.trim() ? 1 : 0)
  );
}
