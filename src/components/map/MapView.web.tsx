import 'maplibre-gl/dist/maplibre-gl.css';

import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Txt } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
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
  onRegionChange,
  style,
}: MapViewProps) {
  const t = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerObjs = useRef<Map<string, maplibregl.Marker>>(new Map());
  const originMarker = useRef<maplibregl.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onMapPressRef = useRef(onMapPress);
  const onRegionChangeRef = useRef(onRegionChange);
  onSelectRef.current = onSelect;
  onMapPressRef.current = onMapPress;
  onRegionChangeRef.current = onRegionChange;

  // 'loading' until the style loads, 'error' if WebGL/tiles fail to come up.
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    setStatus('loading');

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [center?.lng ?? DEFAULT_CENTER.lng, center?.lat ?? DEFAULT_CENTER.lat],
        zoom: center?.zoom ?? DEFAULT_CENTER.zoom,
        maxBounds: US_MAX_BOUNDS,
        minZoom: MAP_MIN_ZOOM,
      });
    } catch {
      // Thrown when WebGL is unavailable (old hardware / disabled in the browser).
      setStatus('error');
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('click', (e) => onMapPressRef.current?.(e.lngLat.lat, e.lngLat.lng));

    const emitRegion = () => {
      const b = map.getBounds();
      onRegionChangeRef.current?.({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
    };
    map.on('moveend', emitRegion);

    // Treat a failure *before the first load* as fatal; ignore transient tile
    // errors afterwards so a single 404 tile never blanks the whole map.
    let loaded = false;
    const failTimer = setTimeout(() => {
      if (!loaded) setStatus('error');
    }, 12000);
    map.on('load', () => {
      loaded = true;
      clearTimeout(failTimer);
      setStatus('ready');
      emitRegion();
    });
    map.on('error', () => {
      if (!loaded) setStatus('error');
    });

    return () => {
      clearTimeout(failTimer);
      map.remove();
      mapRef.current = null;
      markerObjs.current.clear();
      originMarker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Sync marker set with props (runs again once the map (re)loads).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
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
        el.style.cssText = markerCss(m.color, m.id === selectedId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, status]);

  // Reflect selection in marker styling.
  useEffect(() => {
    for (const [id, mk] of markerObjs.current) {
      const m = markers.find((x) => x.id === id);
      if (m) mk.getElement().style.cssText = markerCss(m.color, id === selectedId);
    }
  }, [selectedId, markers, status]);

  // External center changes (e.g. picking a city).
  useEffect(() => {
    if (center && mapRef.current && status === 'ready') {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: center.zoom ?? 11,
        duration: 500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, center?.zoom, status]);

  // Distinct marker for the dropped / searched / located point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, status]);

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {status === 'loading' ? (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.surface }]} pointerEvents="none">
          <ActivityIndicator color={t.accent} />
        </View>
      ) : null}

      {status === 'error' ? (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.surface, padding: Spacing.xl }]}>
          <Txt variant="subtitle" center>
            Map couldn’t load
          </Txt>
          <Txt variant="small" muted center style={{ marginTop: 6, marginBottom: 14, maxWidth: 320 }}>
            Check your connection and that your browser has WebGL enabled, then try again.
          </Txt>
          <Pressable onPress={() => setReloadKey((k) => k + 1)} style={[styles.retry, { backgroundColor: t.accent }]}>
            <Txt variant="small" weight="semibold" color={t.accentText}>
              Retry
            </Txt>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md },
});
