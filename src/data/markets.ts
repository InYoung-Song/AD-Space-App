import type { MarketTier } from './types';

export interface MarketDef {
  id: MarketTier;
  label: string;
  /** Demand multiplier applied to the format's baseline CPM. */
  multiplier: number;
  blurb: string;
}

/**
 * Larger, denser markets command higher CPMs for the same impression.
 * Multipliers center on "mid" = 1.0.
 */
export const MARKETS: Record<MarketTier, MarketDef> = {
  small: { id: 'small', label: 'Small market', multiplier: 0.7, blurb: 'Smaller city / town' },
  mid: { id: 'mid', label: 'Mid market', multiplier: 1.0, blurb: 'Regional city' },
  major: { id: 'major', label: 'Major market', multiplier: 1.35, blurb: 'Large metro area' },
  metro: { id: 'metro', label: 'Top metro', multiplier: 1.8, blurb: 'Top-10 dense metro' },
};

export const MARKET_LIST: MarketDef[] = Object.values(MARKETS);
