import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { FORMATS } from '@/data/formats';
import type { AdFormat } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from './ui/badge';

/** Free, key-less aerial image of the exact coordinates (Esri World Imagery). */
function aerialUrl(lat: number, lng: number, size = 512): string {
  const dLat = 0.0015;
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  const bbox = `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`;
  return (
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export' +
    `?bbox=${bbox}&bboxSR=4326&imageSR=102100&size=${size},${size}&format=jpg&f=image`
  );
}

interface Props {
  lat: number;
  lng: number;
  format?: AdFormat;
  height?: number;
  radius?: number;
  badge?: boolean;
  style?: ViewStyle;
}

export function LocationImage({ lat, lng, format, height = 150, radius = 0, badge = false, style }: Props) {
  const t = useTheme();
  const f = format ? FORMATS[format] : undefined;
  return (
    <View style={[{ height, borderRadius: radius, backgroundColor: t.surfaceSelected, overflow: 'hidden' }, style]}>
      <Image
        source={{ uri: aerialUrl(lat, lng) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={180}
      />
      {badge && f ? (
        <View style={[styles.badge, { backgroundColor: withAlpha('#000000', 0.5) }]}>
          <Ionicons name={f.icon} size={13} color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
