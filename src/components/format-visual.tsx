import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { FORMATS } from '@/data/formats';
import type { AdFormat } from '@/data/types';
import { withAlpha } from './ui/badge';

interface Props {
  format: AdFormat;
  height?: number;
  radius?: number;
  iconSize?: number;
  style?: ViewStyle;
}

/** Generated, offline-safe "cover" for a listing: a tinted block with the format icon. */
export function FormatVisual({ format, height = 150, radius = 0, iconSize = 52, style }: Props) {
  const f = FORMATS[format];
  return (
    <View
      style={[
        { height, borderRadius: radius, backgroundColor: f.color },
        styles.wrap,
        style,
      ]}>
      <View style={[styles.blob, { backgroundColor: withAlpha('#ffffff', 0.14), top: -28, left: -18 }]} />
      <View
        style={[
          styles.blob,
          { backgroundColor: withAlpha('#000000', 0.1), bottom: -42, right: -14, width: 150, height: 150 },
        ]}
      />
      <Ionicons name={f.icon} size={iconSize} color={withAlpha('#ffffff', 0.96)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  blob: { position: 'absolute', width: 120, height: 120, borderRadius: 999 },
});
