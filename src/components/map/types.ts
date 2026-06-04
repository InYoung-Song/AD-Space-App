import type { StyleProp, ViewStyle } from 'react-native';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
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
  style?: StyleProp<ViewStyle>;
}

/** Free, key-less vector tiles + style. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Continental-US default framing when no markers/center are provided. */
export const DEFAULT_CENTER = { lat: 39.5, lng: -98.35, zoom: 3.4 };

/** Lock the map to the (continental) United States. [[west,south],[east,north]] */
export const US_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-128, 22],
  [-64, 52],
];
export const MAP_MIN_ZOOM = 3;
