import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { FORMATS } from '@/data/formats';
import { MARKETS } from '@/data/markets';
import type { Listing } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { quickMonthly } from '@/lib/estimator';
import { formatImpressions } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { FormatVisual } from './format-visual';
import { PricePill } from './price-pill';
import { Card, cardShadow } from './ui/card';
import { Txt } from './ui/text';
import { withAlpha } from './ui/badge';

export function ListingCard({ listing }: { listing: Listing }) {
  const t = useTheme();
  const router = useRouter();
  const fav = useAppStore((s) => s.favorites.includes(listing.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const fmt = FORMATS[listing.format];
  const monthly = quickMonthly(listing);

  return (
    <Card flat style={[styles.card, cardShadow]}>
      <Pressable
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
        style={styles.clip}>
        <View>
          <FormatVisual format={listing.format} height={138} />
          <View style={[styles.imgBadge, { backgroundColor: withAlpha('#000000', 0.42) }]}>
            <Ionicons name={fmt.icon} size={13} color="#fff" />
            <Txt variant="label" color="#fff">
              {fmt.short}
            </Txt>
          </View>
          <Pressable
            onPress={() => toggleFavorite(listing.id)}
            hitSlop={8}
            style={[styles.heart, { backgroundColor: t.surface }]}>
            <Ionicons
              name={fav ? 'heart' : 'heart-outline'}
              size={18}
              color={fav ? t.danger : t.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Txt variant="subtitle" numberOfLines={1}>
            {listing.title}
          </Txt>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color={t.textMuted} />
            <Txt variant="small" muted numberOfLines={1} style={{ flex: 1 }}>
              {listing.city}, {listing.state} · {MARKETS[listing.marketTier].label}
            </Txt>
          </View>
          <View style={styles.footer}>
            <PricePill low={monthly * 0.85} high={monthly * 1.15} compact />
            <View style={styles.row}>
              <Ionicons name="eye-outline" size={14} color={t.textMuted} />
              <Txt variant="small" muted>
                {formatImpressions(listing.dec)}/day
              </Txt>
            </View>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'visible' },
  clip: { borderRadius: Radius.lg, overflow: 'hidden' },
  body: { padding: 14, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  imgBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  heart: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
