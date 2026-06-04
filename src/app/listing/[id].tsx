import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { EstimatorPanel } from '@/components/estimator-panel';
import { LocationImage } from '@/components/location-image';
import { RequestInfoForm } from '@/components/request-info-form';
import { Button } from '@/components/ui/button';
import { Txt } from '@/components/ui/text';
import { withAlpha } from '@/components/ui/badge';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { FORMATS } from '@/data/formats';
import { getListingById } from '@/data/listings';
import { MARKETS } from '@/data/markets';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';
import { useUserData } from '@/lib/user-data';

export default function ListingDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListingById(id);

  const { isFavorite, toggleFavorite } = useUserData();
  const fav = listing ? isFavorite(listing.id) : false;
  const inCompare = useAppStore((s) => (listing ? s.compareIds.includes(listing.id) : false));
  const toggleCompare = useAppStore((s) => s.toggleCompare);

  const [weeks, setWeeks] = useState(listing ? Math.max(4, listing.minWeeks) : 4);
  const [units, setUnits] = useState(1);

  if (!listing) {
    return (
      <View style={[styles.notFound, { backgroundColor: t.background }]}>
        <Txt variant="subtitle">Space not found</Txt>
        <Button title="Go back" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const fmt = FORMATS[listing.format];
  const market = MARKETS[listing.marketTier];

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <View>
          <LocationImage lat={listing.lat} lng={listing.lng} format={listing.format} height={230} badge />
          <Pressable
            onPress={() => toggleFavorite(listing.id)}
            style={[styles.fab, { top: insets.top + 6, backgroundColor: t.surface }]}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? t.danger : t.text} />
          </Pressable>
        </View>

        <View style={[styles.sheet, { backgroundColor: t.background }]}>
          <View style={styles.inner}>
            <View style={[styles.fmtBadge, { backgroundColor: withAlpha(fmt.color, 0.16) }]}>
              <Ionicons name={fmt.icon} size={14} color={fmt.color} />
              <Txt variant="label" color={fmt.color}>
                {fmt.label}
              </Txt>
            </View>

            <Txt variant="title">{listing.title}</Txt>
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={15} color={t.textMuted} />
              <Txt variant="small" muted>
                {listing.address} · {listing.city}, {listing.state} · {market.label}
              </Txt>
            </View>

            {listing.description ? (
              <Txt variant="body" muted style={{ marginTop: 4 }}>
                {listing.description}
              </Txt>
            ) : null}

            <View style={styles.stats}>
              <Stat icon="eye-outline" label="Daily reach" value={`${listing.dec.toLocaleString()}`} t={t} />
              {listing.dimensions ? <Stat icon="resize-outline" label="Size" value={listing.dimensions} t={t} /> : null}
              <Stat icon="time-outline" label="Min term" value={`${listing.minWeeks} wks`} t={t} />
              <Stat
                icon={listing.digital ? 'flash-outline' : 'bulb-outline'}
                label="Type"
                value={listing.digital ? 'Digital' : listing.illuminated ? 'Illuminated' : 'Static'}
                t={t}
              />
            </View>

            <Section title="Estimate your campaign" icon="calculator-outline" t={t}>
              <EstimatorPanel listing={listing} weeks={weeks} units={units} onWeeks={setWeeks} onUnits={setUnits} />
              <Disclaimer />
            </Section>

            <View style={styles.actionRow}>
              <View style={{ flex: 1 }}>
                <Button
                  title={inCompare ? 'In compare' : 'Add to compare'}
                  icon="git-compare-outline"
                  variant={inCompare ? 'secondary' : 'ghost'}
                  onPress={() => toggleCompare(listing.id)}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={fav ? 'Saved' : 'Save'}
                  icon={fav ? 'heart' : 'heart-outline'}
                  variant={fav ? 'secondary' : 'ghost'}
                  onPress={() => toggleFavorite(listing.id)}
                  fullWidth
                />
              </View>
            </View>

            <Section title="Request info" icon="mail-outline" t={t}>
              <Txt variant="small" muted style={{ marginBottom: 4 }}>
                Note your interest — saved on this device only. No booking or payment is made here.
              </Txt>
              <RequestInfoForm listing={listing} weeks={weeks} units={units} />
            </Section>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
  t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Ionicons name={icon} size={16} color={t.accent} />
      <Txt variant="small" weight="semibold">
        {value}
      </Txt>
      <Txt variant="label" muted>
        {label.toUpperCase()}
      </Txt>
    </View>
  );
}

function Section({
  title,
  icon,
  t,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  t: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 12, marginTop: 8 }}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={t.accent} />
        <Txt variant="heading">{title}</Txt>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: { marginTop: -22, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  inner: { padding: Spacing.lg, gap: 10 },
  fmtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  stat: {
    flexGrow: 1,
    minWidth: 80,
    alignItems: 'flex-start',
    gap: 3,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
