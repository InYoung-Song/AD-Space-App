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
  onSelect?: (id: string) => void;
  onBackgroundPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Free, key-less vector tiles + style. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Continental-US default framing when no markers/center are provided. */
export const DEFAULT_CENTER = { lat: 39.5, lng: -98.35, zoom: 3.2 };
