import type { Listing } from '@/data/types';
import { estimate } from './estimator';

export interface ScoredSpace {
  listing: Listing;
  /** Representative cost (mid media + one-time production) for the period. */
  cost: number;
  impressions: number;
  /** Impressions per dollar — higher is better value. */
  value: number;
}

export interface PlanResult {
  items: ScoredSpace[];
  totalCost: number;
  totalImpressions: number;
}

/** Mid-point total cost for one unit of a space over `weeks`. */
export function pointCost(listing: Listing, weeks: number): number {
  const e = estimate({ listing, weeks, units: 1 });
  return e.mediaCost + e.productionCost;
}

export function scoreSpace(listing: Listing, weeks: number): ScoredSpace {
  const e = estimate({ listing, weeks, units: 1 });
  const cost = e.mediaCost + e.productionCost;
  return { listing, cost, impressions: e.totalImpressions, value: cost > 0 ? e.totalImpressions / cost : 0 };
}

/** Spaces whose individual cost fits the budget, most cost-effective first. */
export function fittingSpaces(listings: Listing[], budget: number, weeks: number): ScoredSpace[] {
  return listings
    .map((l) => scoreSpace(l, weeks))
    .filter((s) => s.cost <= budget)
    .sort((a, b) => b.value - a.value);
}

/**
 * Greedy "max reach for the budget": add the most cost-effective spaces
 * (one unit each) until the budget can't fit another. A simple, transparent
 * heuristic for the knapsack of impressions vs. cost.
 */
export function buildPlan(listings: Listing[], budget: number, weeks: number): PlanResult {
  const scored = fittingSpaces(listings, budget, weeks);
  const items: ScoredSpace[] = [];
  let totalCost = 0;
  let totalImpressions = 0;
  for (const s of scored) {
    if (totalCost + s.cost <= budget) {
      items.push(s);
      totalCost += s.cost;
      totalImpressions += s.impressions;
    }
  }
  return { items, totalCost, totalImpressions };
}
