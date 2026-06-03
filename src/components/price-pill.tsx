import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRange } from '@/lib/format';
import { Txt } from './ui/text';

interface Props {
  low: number;
  high: number;
  caption?: string;
  compact?: boolean;
}

export function PricePill({ low, high, caption = 'est. / 4 wks', compact }: Props) {
  const t = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: t.accentSoft }, compact && styles.compact]}>
      <Txt weight="bold" color={t.accentSoftText} style={{ fontSize: compact ? 13 : 15 }}>
        {formatRange(low, high)}
      </Txt>
      <Txt color={t.accentSoftText} style={{ fontSize: 10, opacity: 0.85, fontWeight: '600' }}>
        {caption}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  compact: { paddingHorizontal: 10, paddingVertical: 5 },
});
