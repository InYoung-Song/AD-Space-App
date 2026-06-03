/** Core domain types for ad-space listings and the cost estimator. */

export type AdFormat =
  | 'static_billboard'
  | 'digital_billboard'
  | 'bus_wrap'
  | 'bus_king'
  | 'taxi_top'
  | 'transit_shelter'
  | 'mall_poster';

export type MarketTier = 'small' | 'mid' | 'major' | 'metro';

export interface Listing {
  id: string;
  title: string;
  format: AdFormat;
  /** Latitude / longitude for the map marker. */
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  marketTier: MarketTier;
  /** Daily Effective Circulation — estimated people who see the space per day. */
  dec: number;
  dimensions?: string;
  illuminated?: boolean;
  digital?: boolean;
  /** Minimum bookable term in weeks (industry standard is 4-week cycles). */
  minWeeks: number;
  /** Generic, non-real vendor label for the demo. */
  vendorLabel?: string;
  description?: string;
  /** Optional real photo for future use; the UI falls back to a generated visual. */
  imageUri?: string;
}
