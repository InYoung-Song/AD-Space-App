import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterBar } from '@/components/filter-bar';
import { LocationImage } from '@/components/location-image';
import { LocationSearch } from '@/components/location-search';
import MapView from '@/components/map/MapView';
import type { MapBounds } from '@/components/map/types';
import { PricePill } from '@/components/price-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Txt } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { FORMATS } from '@/data/formats';
import { getListingById, LISTINGS } from '@/data/listings';
import { MARKETS } from '@/data/markets';
import type { Listing } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { quickMonthly } from '@/lib/estimator';
import { activeFilterCount, filterListings } from '@/lib/filtering';
import { formatImpressions } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { useUserData } from '@/lib/user-data';

type Point = { lat: number; lng: number };

/** Cap on how many pins we mount at once, so a wide view stays smooth. */
const MAX_MARKERS = 240;

/**
 * When more spaces are in view than we can draw, pick an even spread across the
 * viewport instead of clustering near its center — otherwise edge regions
 * (e.g. Texas at a US-wide zoom) would show no pins at all. Round-robins one
 * marker per grid cell per pass, so every populated area is represented first.
 */
function sampleAcross(list: Listing[], bounds: MapBounds, cap: number): Listing[] {
  if (list.length <= cap) return list;
  const cols = 16;
  const rows = 10;
  const w = bounds.east - bounds.west || 1;
  const h = bounds.north - bounds.south || 1;
  const cells = new Map<number, Listing[]>();
  for (const l of list) {
    const cx = Math.min(cols - 1, Math.max(0, Math.floor(((l.lng - bounds.west) / w) * cols)));
    const cy = Math.min(rows - 1, Math.max(0, Math.floor(((l.lat - bounds.south) / h) * rows)));
    const key = cy * cols + cx;
    const bucket = cells.get(key);
    if (bucket) bucket.push(l);
    else cells.set(key, [l]);
  }
  const keys = [...cells.keys()];
  const out: Listing[] = [];
  for (let depth = 0; out.length < cap; depth++) {
    let added = false;
    for (const k of keys) {
      const bucket = cells.get(k)!;
      if (bucket.length > depth) {
        out.push(bucket[depth]);
        added = true;
        if (out.length >= cap) break;
      }
    }
    if (!added) break;
  }
  return out;
}

function dist2(a: Point, b: Point): number {
  const dy = a.lat - b.lat;
  const dx = (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180);
  return dy * dy + dx * dx;
}
const miles = (d2: number) => Math.sqrt(d2) * 69;

export default function MapScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const filters = useAppStore((s) => s.filters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const filterCount = activeFilterCount(filters);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Point | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(() => filterListings(LISTINGS, filters), [filters]);

  // Ad spaces inside the current viewport — shown as pins immediately, no pin
  // drop required. Capped to the nearest-to-center when a wide area is in view.
  const visible = useMemo(() => {
    if (!bounds) {
      // Before the first region event: an even stride so the first frame is spread.
      if (filtered.length <= MAX_MARKERS) return filtered;
      const step = Math.ceil(filtered.length / MAX_MARKERS);
      return filtered.filter((_, i) => i % step === 0);
    }
    const inView = filtered.filter(
      (l) => l.lng >= bounds.west && l.lng <= bounds.east && l.lat >= bounds.south && l.lat <= bounds.north,
    );
    return sampleAcross(inView, bounds, MAX_MARKERS);
  }, [filtered, bounds]);

  // Ad spaces near the dropped/searched/located point, closest first (drawer).
  const nearby = useMemo(() => {
    if (!origin) return [];
    const dLat = 0.6;
    const dLng = 0.6 / Math.cos((origin.lat * Math.PI) / 180);
    return filtered
      .filter((l) => Math.abs(l.lat - origin.lat) <= dLat && Math.abs(l.lng - origin.lng) <= dLng)
      .map((l) => ({ l, d: dist2(origin, l) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 80);
  }, [origin, filtered]);

  const markers = useMemo(
    () => visible.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, color: FORMATS[l.format].color })),
    [visible],
  );

  const selected = selectedId ? getListingById(selectedId) : undefined;
  useEffect(() => {
    if (selectedId && !filtered.some((l) => l.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  function dropAt(lat: number, lng: number, zoom = 9) {
    setSelectedId(null);
    setOrigin({ lat, lng });
    setCenter({ lat, lng, zoom });
  }

  function useMyLocation() {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          dropAt(pos.coords.latitude, pos.coords.longitude, 11);
          setLocating(false);
        },
        () => setLocating(false),
        { enableHighAccuracy: false, timeout: 10000 },
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <MapView
        style={StyleSheet.absoluteFill}
        markers={markers}
        selectedId={selectedId}
        center={center}
        origin={origin}
        onSelect={setSelectedId}
        onMapPress={(lat, lng) => dropAt(lat, lng)}
        onRegionChange={setBounds}
      />

      <View style={[styles.top, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <Card style={styles.header}>
          <LocationSearch onSelect={(r) => dropAt(r.lat, r.lng, 11)} />
          <View style={styles.headerRow}>
            <Txt variant="small" muted style={{ flex: 1 }}>
              {origin
                ? `${nearby.length} space${nearby.length === 1 ? '' : 's'} near your pin`
                : `${visible.length} space${visible.length === 1 ? '' : 's'} in view · tap to drop a pin`}
            </Txt>
            {filterCount > 0 ? (
              <Pressable
                onPress={resetFilters}
                style={(s) => [
                  styles.locate,
                  { borderColor: t.border, backgroundColor: (s as { hovered?: boolean }).hovered ? t.surfaceSelected : 'transparent' },
                ]}>
                <Ionicons name="close" size={13} color={t.textSecondary} />
                <Txt variant="small" weight="semibold" color={t.textSecondary}>
                  Clear {filterCount}
                </Txt>
              </Pressable>
            ) : null}
            <Pressable
              onPress={useMyLocation}
              style={(s) => [
                styles.locate,
                { borderColor: t.border, backgroundColor: (s as { hovered?: boolean }).hovered ? t.surfaceSelected : 'transparent' },
              ]}>
              <Ionicons name={locating ? 'sync' : 'navigate'} size={14} color={t.accent} />
              <Txt variant="small" weight="semibold" color={t.accent}>
                {locating ? 'Locating…' : 'Near me'}
              </Txt>
            </Pressable>
          </View>
          <FilterBar />
        </Card>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.sm }]} pointerEvents="box-none">
        {selected ? (
          <MapPreview listing={selected} onClose={() => setSelectedId(null)} />
        ) : filterCount > 0 && filtered.length === 0 ? (
          <Card padded style={styles.hint}>
            <Ionicons name="filter-outline" size={18} color={t.textMuted} />
            <Txt variant="small" muted style={{ flex: 1 }}>
              Your filters hide every space. Clear them to see ad spaces again.
            </Txt>
            <Button title="Clear" size="sm" variant="secondary" onPress={resetFilters} />
          </Card>
        ) : !origin ? (
          <Card padded style={styles.hint}>
            <Ionicons name="hand-left-outline" size={18} color={t.accent} />
            <Txt variant="small" muted style={{ flex: 1 }}>
              Tap anywhere on the map to drop a pin and see nearby ad spaces — or search a place / use
              “Near me”.
            </Txt>
          </Card>
        ) : nearby.length === 0 ? (
          <Card padded style={styles.hint}>
            <Ionicons name="alert-circle-outline" size={18} color={t.textMuted} />
            <Txt variant="small" muted style={{ flex: 1 }}>
              No mapped ad spaces within ~40 miles of your pin. Try a spot closer to a city.
            </Txt>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            <Txt variant="label" color="#fff" style={[styles.nearbyLabel, { backgroundColor: t.accent }]}>
              {nearby.length} NEARBY · CLOSEST FIRST
            </Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyRow}>
              {nearby.slice(0, 24).map(({ l, d }) => (
                <NearbyCard
                  key={l.id}
                  listing={l}
                  distance={miles(d)}
                  onPress={() => router.push({ pathname: '/listing/[id]', params: { id: l.id } })}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

function NearbyCard({ listing, distance, onPress }: { listing: Listing; distance: number; onPress: () => void }) {
  const t = useTheme();
  const monthly = quickMonthly(listing);
  return (
    <Pressable
      onPress={onPress}
      style={(s) => [
        styles.nearbyCard,
        { backgroundColor: t.surface, borderColor: t.border, transform: [{ translateY: (s as { hovered?: boolean }).hovered ? -3 : 0 }] },
      ]}>
      <LocationImage lat={listing.lat} lng={listing.lng} format={listing.format} height={72} radius={Radius.md} />
      <View style={{ padding: 8, gap: 4 }}>
        <Txt variant="small" weight="semibold" numberOfLines={1}>
          {listing.title}
        </Txt>
        <Txt variant="label" muted numberOfLines={1}>
          {FORMATS[listing.format].short} · {distance < 1 ? '<1' : Math.round(distance)} mi
        </Txt>
        <PricePill low={monthly * 0.85} high={monthly * 1.15} compact />
      </View>
    </Pressable>
  );
}

function MapPreview({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const t = useTheme();
  const router = useRouter();
  const fmt = FORMATS[listing.format];
  const monthly = quickMonthly(listing);

  const { isFavorite, toggleFavorite } = useUserData();
  const fav = isFavorite(listing.id);
  const inCompare = useAppStore((s) => s.compareIds.includes(listing.id));
  const toggleCompare = useAppStore((s) => s.toggleCompare);

  return (
    <Card style={styles.preview}>
      <View style={styles.previewRow}>
        <LocationImage lat={listing.lat} lng={listing.lng} format={listing.format} height={78} radius={Radius.md} style={{ width: 78 }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="subtitle" numberOfLines={1}>
            {listing.title}
          </Txt>
          <Txt variant="small" muted numberOfLines={1}>
            {fmt.label} · {listing.city}, {listing.state} · {MARKETS[listing.marketTier].label}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PricePill low={monthly * 0.85} high={monthly * 1.15} compact />
            <Txt variant="small" muted>
              {formatImpressions(listing.dec)}/day
            </Txt>
          </View>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={18} color={t.textMuted} />
        </Pressable>
      </View>

      <View style={styles.previewActions}>
        <View style={{ flex: 1 }}>
          <Button
            title="View details"
            size="sm"
            icon="arrow-forward"
            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
            fullWidth
          />
        </View>
        <Pressable
          onPress={() => toggleCompare(listing.id)}
          style={[styles.iconBtn, { borderColor: inCompare ? t.accent : t.border, backgroundColor: inCompare ? t.accentSoft : 'transparent' }]}>
          <Ionicons name="git-compare-outline" size={18} color={inCompare ? t.accent : t.textSecondary} />
        </Pressable>
        <Pressable onPress={() => toggleFavorite(listing.id)} style={[styles.iconBtn, { borderColor: t.border }]}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? t.danger : t.textSecondary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: Spacing.md },
  header: { padding: 12, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Spacing.md },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nearbyLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  nearbyRow: { gap: 10, paddingBottom: 2 },
  nearbyCard: {
    width: 168,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  preview: { padding: 12, gap: 12 },
  previewRow: { flexDirection: 'row', gap: 12 },
  close: { padding: 2, alignSelf: 'flex-start' },
  previewActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
