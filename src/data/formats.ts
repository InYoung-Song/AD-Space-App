import { Ionicons } from '@expo/vector-icons';

import type { AdFormat } from './types';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export interface FormatDef {
  id: AdFormat;
  label: string;
  short: string;
  icon: IoniconName;
  /** Marker / accent color for this format. */
  color: string;
  /**
   * Effective cost per 1,000 impressions (CPM) at a baseline "mid" market.
   * Grounded in published 2025 OOH ranges; scaled by market tier in the estimator.
   */
  baseCpm: number;
  /** One-time production/printing/install cost per unit (0 for digital). */
  productionCost: number;
  /** Typical monthly price range (mid market) shown as sanity context. */
  monthlyLow: number;
  monthlyHigh: number;
  blurb: string;
}

/**
 * Baseline CPMs and ranges are derived from public 2025 OOH figures
 * (AdQuick, Influize, Streetlevel Media, True Impact). They are illustrative
 * averages, not quotes.
 */
export const FORMATS: Record<AdFormat, FormatDef> = {
  static_billboard: {
    id: 'static_billboard',
    label: 'Static Billboard',
    short: 'Billboard',
    icon: 'easel-outline',
    color: '#F0883E',
    baseCpm: 6,
    productionCost: 600,
    monthlyLow: 1500,
    monthlyHigh: 15000,
    blurb: 'Classic printed bulletin or poster panel along roads and highways.',
  },
  digital_billboard: {
    id: 'digital_billboard',
    label: 'Digital Billboard',
    short: 'Digital',
    icon: 'tv-outline',
    color: '#6D5DF6',
    baseCpm: 9,
    productionCost: 0,
    monthlyLow: 1200,
    monthlyHigh: 30000,
    blurb: 'LED screen rotating multiple advertisers — no print, flexible creative.',
  },
  bus_wrap: {
    id: 'bus_wrap',
    label: 'Full Bus Wrap',
    short: 'Bus Wrap',
    icon: 'bus-outline',
    color: '#2FB67C',
    baseCpm: 3.5,
    productionCost: 2500,
    monthlyLow: 1500,
    monthlyHigh: 8000,
    blurb: 'Vehicle-length wrap that travels across the whole transit route.',
  },
  bus_king: {
    id: 'bus_king',
    label: 'Bus King Panel',
    short: 'Bus Side',
    icon: 'bus',
    color: '#19A0C9',
    baseCpm: 3,
    productionCost: 600,
    monthlyLow: 600,
    monthlyHigh: 2500,
    blurb: 'Large side panel on the curb-facing length of a bus.',
  },
  taxi_top: {
    id: 'taxi_top',
    label: 'Taxi Top',
    short: 'Taxi',
    icon: 'car-outline',
    color: '#E5B83B',
    baseCpm: 5,
    productionCost: 300,
    monthlyLow: 500,
    monthlyHigh: 1800,
    blurb: 'Roof-mounted display circulating dense downtown streets.',
  },
  transit_shelter: {
    id: 'transit_shelter',
    label: 'Transit Shelter',
    short: 'Shelter',
    icon: 'storefront-outline',
    color: '#E0598B',
    baseCpm: 5.5,
    productionCost: 250,
    monthlyLow: 700,
    monthlyHigh: 3000,
    blurb: 'Backlit poster at a bus stop / shelter — eye-level pedestrian reach.',
  },
  mall_poster: {
    id: 'mall_poster',
    label: 'Mall Poster',
    short: 'Mall',
    icon: 'image-outline',
    color: '#8A6BF0',
    baseCpm: 7,
    productionCost: 200,
    monthlyLow: 600,
    monthlyHigh: 2500,
    blurb: 'Indoor poster near shopping-center entrances and concourses.',
  },
};

export const FORMAT_LIST: FormatDef[] = Object.values(FORMATS);
