import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { FilterBar } from '@/components/filter-bar';
import { FormatVisual } from '@/components/format-visual';
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

  const listings = useMemo(() => filterListings(LISTINGS, filters), [filters]);
  const markers = useMemo(
    () => listings.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, color: FORMATS[l.format].color })),
    [listings],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
  const selected = selectedId ? getListingById(selectedId) : undefined;

  useEffect(() => {
    if (selectedId && !listings.some((l) => l.id === selectedId)) setSelectedId(null);
  }, [listings, selectedId]);

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
              {listings.length} space{listings.length === 1 ? '' : 's'} in the US
            </Txt>
          </View>
          <FilterBar />
        </Card>
      </View>

      {selected ? (
        <View style={[styles.previewWrap, { paddingBottom: insets.bottom + Spacing.sm }]} pointerEvents="box-none">
          <MapPreview listing={selected} onClose={() => setSelectedId(null)} />
        </View>
      ) : (
        <View style={[styles.hintWrap, { paddingBottom: insets.bottom + Spacing.sm }]} pointerEvents="none">
          <Disclaimer />
        </View>
      )}
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
        <FormatVisual format={listing.format} height={78} radius={Radius.md} iconSize={26} style={{ width: 78 }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="subtitle" numberOfLines={1}>
            {listing.title}
          </Txt>
          <Txt variant="small" muted numberOfLines={1}>
            {fmt.label} · {listing.city}, {listing.state}
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
  previewWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Spacing.md },
  hintWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Spacing.md },
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
