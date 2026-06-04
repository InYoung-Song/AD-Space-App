import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Disclaimer } from '@/components/disclaimer';
import { LocationImage } from '@/components/location-image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Txt } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { FORMATS } from '@/data/formats';
import { LISTINGS } from '@/data/listings';
import { MARKETS } from '@/data/markets';
import type { Listing } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { estimate } from '@/lib/estimator';
import { formatCurrency, formatRange } from '@/lib/format';
import { useAppStore } from '@/lib/store';

const ROWS: { key: string; label: string }[] = [
  { key: 'format', label: 'Format' },
  { key: 'location', label: 'Location' },
  { key: 'market', label: 'Market' },
  { key: 'reach', label: 'Daily reach' },
  { key: 'cpm', label: 'Effective CPM' },
  { key: 'price', label: 'Est. / 4 weeks' },
  { key: 'term', label: 'Min term' },
];

export default function CompareScreen() {
  const t = useTheme();
  const router = useRouter();
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);

  const items = useMemo(() => LISTINGS.filter((l) => compareIds.includes(l.id)), [compareIds]);

  if (items.length < 2) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background }]}>
        <Ionicons name="git-compare-outline" size={40} color={t.textMuted} />
        <Txt variant="subtitle" center>
          Pick at least two spaces
        </Txt>
        <Txt variant="small" muted center style={{ maxWidth: 280 }}>
          Select spaces from Saved (up to 4) to see them side by side.
        </Txt>
        <Button title="Go to Saved" icon="heart-outline" onPress={() => router.push('/saved')} />
      </View>
    );
  }

  function cell(listing: Listing, key: string): string {
    const fmt = FORMATS[listing.format];
    const est = estimate({ listing, weeks: 4, units: 1 });
    switch (key) {
      case 'format':
        return fmt.label;
      case 'location':
        return `${listing.city}, ${listing.state}`;
      case 'market':
        return MARKETS[listing.marketTier].label;
      case 'reach':
        return `${listing.dec.toLocaleString()}/day`;
      case 'cpm':
        return `${formatCurrency(est.cpm)}`;
      case 'price':
        return formatRange(est.mediaLow, est.mediaHigh);
      case 'term':
        return `${listing.minWeeks} wks`;
      default:
        return '';
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
          {items.map((listing) => {
            const fmt = FORMATS[listing.format];
            return (
              <Card key={listing.id} style={styles.col}>
                <View style={styles.colClip}>
                  <LocationImage lat={listing.lat} lng={listing.lng} format={listing.format} height={84} badge />
                  <Pressable onPress={() => toggleCompare(listing.id)} style={[styles.remove, { backgroundColor: t.surface }]}>
                    <Ionicons name="close" size={16} color={t.textSecondary} />
                  </Pressable>
                </View>
                <View style={{ padding: 12, gap: 8 }}>
                  <Txt variant="subtitle" numberOfLines={2} style={{ minHeight: 44 }}>
                    {listing.title}
                  </Txt>
                  {ROWS.map((r) => (
                    <View key={r.key} style={[styles.metric, { borderTopColor: t.border }]}>
                      <Txt variant="label" muted>
                        {r.label.toUpperCase()}
                      </Txt>
                      <Txt variant="small" weight={r.key === 'price' ? 'bold' : 'semibold'} color={r.key === 'price' ? t.accent : undefined}>
                        {cell(listing, r.key)}
                      </Txt>
                    </View>
                  ))}
                  <View style={{ marginTop: 4 }}>
                    <Button
                      title="Details"
                      size="sm"
                      variant="ghost"
                      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
                      fullWidth
                    />
                  </View>
                </View>
              </Card>
            );
          })}
        </ScrollView>
        <Disclaimer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { width: 240, padding: 0, overflow: 'visible' },
  colClip: { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, overflow: 'hidden' },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metric: { gap: 2, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});
