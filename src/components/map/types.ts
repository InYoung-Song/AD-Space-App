import type { StyleProp, ViewStyle } from 'react-native';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
}

/** The map's currently visible geographic window. */
export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface MapViewProps {
  markers: MapMarker[];
  selectedId?: string | null;
  center?: { lat: number; lng: number; zoom?: number };
  /** A dropped/searched/located point, rendered as a distinct marker. */
  origin?: { lat: number; lng: number } | null;
  onSelect?: (id: string) => void;
  /** Fired when the user taps empty map — reports the tapped coordinates. */
  onMapPress?: (lat: number, lng: number) => void;
  /** Fired after the map settles (load / pan / zoom) with the visible bounds. */
  onRegionChange?: (bounds: MapBounds) => void;
  style?: StyleProp<ViewStyle>;
}

/** Free, key-less vector tiles + style. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Continental-US default framing when no markers/center are provided. */
export const DEFAULT_CENTER = { lat: 39.5, lng: -98.35, zoom: 3.4 };

/**
 * Pan limit covering all 50 states — wide enough to reach Alaska and Hawaii by
 * panning, while the default view still frames the continental US.
 * [[west,south],[east,north]]
 */
export const US_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-170, 17],
  [-63, 72],
];
export const MAP_MIN_ZOOM = 2.6;
