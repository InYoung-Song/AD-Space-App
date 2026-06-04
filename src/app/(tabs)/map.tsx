import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterBar } from '@/components/filter-bar';
import { LocationImage } from '@/components/location-image';
import { LocationSearch } from '@/components/location-search';
import MapView from '@/components/map/MapView';
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
import { filterListings } from '@/lib/filtering';
import { formatImpressions } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { useUserData } from '@/lib/user-data';

export default function MapScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const filters = useAppStore((s) => s.filters);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
  const [locating, setLocating] = useState(false);

  const listings = useMemo(() => filterListings(LISTINGS, filters), [filters]);

  // Only render pins near the searched / located point so the map stays clean and fast.
  const markers = useMemo(() => {
    if (!center) return [];
    const dLat = 0.7;
    const dLng = 0.7 / Math.cos((center.lat * Math.PI) / 180);
    return listings
      .filter((l) => Math.abs(l.lat - center.lat) <= dLat && Math.abs(l.lng - center.lng) <= dLng)
      .slice(0, 300)
      .map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, color: FORMATS[l.format].color }));
  }, [center, listings]);
  const showPins = markers.length > 0;

  const selected = selectedId ? getListingById(selectedId) : undefined;
  useEffect(() => {
    if (selectedId && !listings.some((l) => l.id === selectedId)) setSelectedId(null);
  }, [listings, selectedId]);

  function useMyLocation() {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 11 });
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
        onSelect={setSelectedId}
        onBackgroundPress={() => setSelectedId(null)}
      />

      <View style={[styles.top, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <Card style={styles.header}>
          <LocationSearch
            onSelect={(r) => {
              setSelectedId(null);
              setCenter({ lat: r.lat, lng: r.lng, zoom: 12 });
            }}
          />
          <View style={styles.headerRow}>
            <Txt variant="small" muted>
              {showPins ? `${markers.length} space${markers.length === 1 ? '' : 's'} nearby` : 'Search or use your location'}
            </Txt>
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

      {selected ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.sm }]} pointerEvents="box-none">
          <MapPreview listing={selected} onClose={() => setSelectedId(null)} />
        </View>
      ) : !showPins ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.sm }]} pointerEvents="box-none">
          <Card padded style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="search-outline" size={18} color={t.textMuted} />
            <Txt variant="small" muted style={{ flex: 1 }}>
              Search a city, tap “Near me”, or pick a format to see billboard spaces on the map.
            </Txt>
          </Card>
        </View>
      ) : null}
    </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
