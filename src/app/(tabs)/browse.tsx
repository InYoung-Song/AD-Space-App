import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterBar } from '@/components/filter-bar';
import { ListingCard } from '@/components/listing-card';
import { Chip } from '@/components/ui/chip';
import { Txt } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { LISTINGS } from '@/data/listings';
import { useTheme } from '@/hooks/use-theme';
import { quickMonthly } from '@/lib/estimator';
import { filterListings } from '@/lib/filtering';
import { useAppStore } from '@/lib/store';

type SortKey = 'reach' | 'priceAsc' | 'priceDesc';

export default function BrowseScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const numColumns = width >= 760 ? 2 : 1;

  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);

  const [sort, setSort] = useState<SortKey>('reach');

  const data = useMemo(() => {
    const list = filterListings(LISTINGS, filters);
    const sorted = [...list];
    if (sort === 'reach') sorted.sort((a, b) => b.dec - a.dec);
    else if (sort === 'priceAsc') sorted.sort((a, b) => quickMonthly(a) - quickMonthly(b));
    else sorted.sort((a, b) => quickMonthly(b) - quickMonthly(a));
    return sorted;
  }, [filters, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: t.background, paddingTop: insets.top }}>
      <FlatList
        key={numColumns}
        data={data}
        keyExtractor={(l) => l.id}
        numColumns={numColumns}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        columnWrapperStyle={numColumns > 1 ? { gap: Spacing.md } : undefined}
        ListHeaderComponent={
          <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
            <View>
              <Txt variant="title">Browse spaces</Txt>
              <Txt variant="small" muted>
                {data.length} result{data.length === 1 ? '' : 's'} · estimated pricing
              </Txt>
            </View>

            <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Ionicons name="search" size={18} color={t.textMuted} />
              <TextInput
                value={filters.query}
                onChangeText={(q) => setFilters({ query: q })}
                placeholder="Search city, address, or space"
                placeholderTextColor={t.textMuted}
                style={[styles.searchInput, { color: t.text }]}
              />
              {filters.query ? (
                <Ionicons name="close-circle" size={18} color={t.textMuted} onPress={() => setFilters({ query: '' })} />
              ) : null}
            </View>

            <FilterBar showMarkets />

            <View style={styles.sortRow}>
              <Txt variant="label" muted style={{ marginRight: 2 }}>
                SORT
              </Txt>
              <Chip label="Reach" selected={sort === 'reach'} onPress={() => setSort('reach')} />
              <Chip label="$ Low" selected={sort === 'priceAsc'} onPress={() => setSort('priceAsc')} />
              <Chip label="$ High" selected={sort === 'priceDesc'} onPress={() => setSort('priceDesc')} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 / numColumns, marginBottom: Spacing.md }}>
            <ListingCard listing={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={t.textMuted} />
            <Txt variant="subtitle" center>
              No spaces match
            </Txt>
            <Txt variant="small" muted center>
              Try clearing a filter or searching a different city.
            </Txt>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  empty: { alignItems: 'center', gap: 8, paddingTop: 60 },
});
