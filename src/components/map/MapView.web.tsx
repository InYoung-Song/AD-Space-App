import 'maplibre-gl/dist/maplibre-gl.css';

import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { DEFAULT_CENTER, MAP_MIN_ZOOM, MAP_STYLE_URL, US_MAX_BOUNDS, type MapViewProps } from './types';

function markerCss(color: string, selected: boolean): string {
  const size = selected ? 22 : 16;
  return `
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};border:3px solid #fff;cursor:pointer;
    box-shadow:0 2px 6px rgba(0,0,0,0.35)${selected ? `,0 0 0 4px ${color}55` : ''};
    transition:all .12s ease;
  `;
}

export default function MapView({
  markers,
  selectedId,
  center,
  origin,
  onSelect,
  onMapPress,
  style,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerObjs = useRef<Map<string, maplibregl.Marker>>(new Map());
  const originMarker = useRef<maplibregl.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onMapPressRef = useRef(onMapPress);
  onSelectRef.current = onSelect;
  onMapPressRef.current = onMapPress;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [center?.lng ?? DEFAULT_CENTER.lng, center?.lat ?? DEFAULT_CENTER.lat],
      zoom: center?.zoom ?? DEFAULT_CENTER.zoom,
      maxBounds: US_MAX_BOUNDS,
      minZoom: MAP_MIN_ZOOM,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('click', (e) => onMapPressRef.current?.(e.lngLat.lat, e.lngLat.lng));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerObjs.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker set with props.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markerObjs.current;
    const nextIds = new Set(markers.map((m) => m.id));

    for (const [id, mk] of existing) {
      if (!nextIds.has(id)) {
        mk.remove();
        existing.delete(id);
      }
    }

    for (const m of markers) {
      let mk = existing.get(m.id);
      if (!mk) {
        const el = document.createElement('div');
        el.style.cssText = markerCss(m.color, false);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectRef.current?.(m.id);
        });
        mk = new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
        existing.set(m.id, mk);
      } else {
        mk.setLngLat([m.lng, m.lat]);
      }
    }
    // Positioning is driven by `center` (search / locate / drop), not auto-fit.
  }, [markers]);

  // Reflect selection in marker styling.
  useEffect(() => {
    for (const [id, mk] of markerObjs.current) {
      const m = markers.find((x) => x.id === id);
      if (m) mk.getElement().style.cssText = markerCss(m.color, id === selectedId);
    }
  }, [selectedId, markers]);

  // External center changes (e.g. picking a city).
  useEffect(() => {
    if (center && mapRef.current) {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: center.zoom ?? 11,
        duration: 500,
      });
    }
  }, [center?.lat, center?.lng, center?.zoom]);

  // Distinct marker for the dropped / searched / located point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!origin) {
      originMarker.current?.remove();
      originMarker.current = null;
      return;
    }
    if (!originMarker.current) {
      const el = document.createElement('div');
      el.style.cssText =
        'width:18px;height:18px;border-radius:50%;background:#6D5DF6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(109,93,246,0.25),0 2px 6px rgba(0,0,0,0.4);';
      originMarker.current = new maplibregl.Marker({ element: el }).setLngLat([origin.lng, origin.lat]).addTo(map);
    } else {
      originMarker.current.setLngLat([origin.lng, origin.lat]);
    }
  }, [origin?.lat, origin?.lng]);

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </View>
  );
}
