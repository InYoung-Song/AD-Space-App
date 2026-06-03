import { ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { FORMAT_LIST } from '@/data/formats';
import { MARKET_LIST } from '@/data/markets';
import { useAppStore } from '@/lib/store';
import { Chip } from './ui/chip';
import { Txt } from './ui/text';

export function FilterBar({ showMarkets = false }: { showMarkets?: boolean }) {
  const formats = useAppStore((s) => s.filters.formats);
  const markets = useAppStore((s) => s.filters.markets);
  const toggleFormat = useAppStore((s) => s.toggleFormat);
  const toggleMarket = useAppStore((s) => s.toggleMarket);

  return (
    <View style={{ gap: Spacing.sm }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {FORMAT_LIST.map((f) => (
          <Chip
            key={f.id}
            label={f.short}
            icon={f.icon}
            tint={f.color}
            selected={formats.includes(f.id)}
            onPress={() => toggleFormat(f.id)}
          />
        ))}
      </ScrollView>

      {showMarkets ? (
        <View style={styles.marketWrap}>
          <Txt variant="label" muted style={{ marginRight: 2 }}>
            MARKET
          </Txt>
          {MARKET_LIST.map((m) => (
            <Chip
              key={m.id}
              label={m.label}
              selected={markets.includes(m.id)}
              onPress={() => toggleMarket(m.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 2, paddingVertical: 2 },
  marketWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
});
