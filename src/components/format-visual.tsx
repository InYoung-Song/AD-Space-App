import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { FORMATS } from '@/data/formats';
import type { AdFormat } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from './ui/badge';

interface Props {
  format: AdFormat;
  height?: number;
  radius?: number;
  iconSize?: number;
  style?: ViewStyle;
}

/**
 * Neutral, offline-safe "cover" for a listing: a muted surface with just a
 * soft tint of the format color and its icon — restrained, not loud.
 */
export function FormatVisual({ format, height = 150, radius = 0, iconSize = 44, style }: Props) {
  const t = useTheme();
  const f = FORMATS[format];
  return (
    <View
      style={[
        { height, borderRadius: radius, backgroundColor: t.surfaceSelected },
        styles.wrap,
        style,
      ]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(f.color, 0.08) }]} />
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(f.color, 0.16) }]}>
        <Ionicons name={f.icon} size={iconSize} color={f.color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  iconWrap: { padding: 18, borderRadius: 999 },
});
