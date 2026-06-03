import { FORMATS } from '@/data/formats';
import { MARKETS } from '@/data/markets';
import type { Listing } from '@/data/types';

export interface EstimateInput {
  listing: Listing;
  /** Campaign length in weeks. */
  weeks: number;
  /** Number of units / panels booked. */
  units: number;
}

export interface Estimate {
  /** Effective cost per 1,000 impressions after the market multiplier. */
  cpm: number;
  impressionsPerUnit: number;
  totalImpressions: number;
  /** Mid-point media spend across all units for the whole period. */
  mediaCost: number;
  mediaLow: number;
  mediaHigh: number;
  /** One-time production/print/install across all units. */
  productionCost: number;
  totalLow: number;
  totalHigh: number;
  /** Normalized 4-week media estimate for a single unit (for list/preview). */
  perFourWeeks: number;
}

/** Width of the low/high band shown around the point estimate. */
const BAND = 0.15;

/**
 * Transparent OOH estimate:
 *   impressions = DEC × days × units
 *   media cost  = (impressions / 1000) × (baseCPM × marketMultiplier)
 *   total       = media band + one-time production
 *
 * All figures are illustrative — never a quote.
 */
export function estimate({ listing, weeks, units }: EstimateInput): Estimate {
  const fmt = FORMATS[listing.format];
  const market = MARKETS[listing.marketTier];
  const cpm = fmt.baseCpm * market.multiplier;

  const days = weeks * 7;
  const impressionsPerUnit = Math.round(listing.dec * days);
  const totalImpressions = impressionsPerUnit * units;

  const mediaCost = (totalImpressions / 1000) * cpm;
  const mediaLow = mediaCost * (1 - BAND);
  const mediaHigh = mediaCost * (1 + BAND);

  const productionCost = fmt.productionCost * units;

  const perFourWeeks = ((listing.dec * 28) / 1000) * cpm;

  return {
    cpm,
    impressionsPerUnit,
    totalImpressions,
    mediaCost,
    mediaLow,
    mediaHigh,
    productionCost,
    totalLow: mediaLow + productionCost,
    totalHigh: mediaHigh + productionCost,
    perFourWeeks,
  };
}

/** Quick 4-week, single-unit media estimate used on cards and the map preview. */
export function quickMonthly(listing: Listing): number {
  return estimate({ listing, weeks: 4, units: 1 }).perFourWeeks;
}
