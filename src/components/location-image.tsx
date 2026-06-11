import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { FORMATS } from '@/data/formats';
import type { AdFormat } from '@/data/types';
import { FormatVisual } from './format-visual';
import { Txt } from './ui/text';
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
  imageUri?: string;
  height?: number;
  radius?: number;
  badge?: boolean;
  style?: ViewStyle;
}

export function LocationImage({
  lat,
  lng,
  format,
  imageUri,
  height = 150,
  radius = 0,
  badge = false,
  style,
}: Props) {
  const t = useTheme();
  const f = format ? FORMATS[format] : undefined;
  const sourceUri = imageUri ?? aerialUrl(lat, lng);

  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset state if the image we're pointing at changes (e.g. recycled card).
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [sourceUri]);

  // If nothing loads within a few seconds, fall back rather than show a blank box.
  useEffect(() => {
    if (loaded || failed) return;
    const id = setTimeout(() => setFailed(true), 6000);
    return () => clearTimeout(id);
  }, [sourceUri, loaded, failed]);

  // Graceful fallback: the format's neutral cover (or a plain surface) — never a
  // blank box with overlay text floating on nothing.
  if (failed) {
    if (format) {
      return (
        <FormatVisual
          format={format}
          height={height}
          radius={radius}
          iconSize={Math.round(Math.min(44, Math.max(18, height * 0.36)))}
          style={style}
        />
      );
    }
    return <View style={[{ height, borderRadius: radius, backgroundColor: t.surfaceSelected }, style]} />;
  }

  return (
    <View style={[{ height, borderRadius: radius, backgroundColor: t.surfaceSelected, overflow: 'hidden' }, style]}>
      <Image
        source={{ uri: sourceUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={180}
        recyclingKey={sourceUri}
        accessibilityLabel={imageUri ? 'Listing image' : 'Aerial view of the ad space location'}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
      />
      <View style={styles.overlay} pointerEvents="none">
        <Txt variant="label" color="#fff" style={styles.overlayText}>
          {imageUri ? 'Actual listing image' : 'Location preview'}
        </Txt>
        {!imageUri ? (
          <Txt variant="small" color="#fff" style={styles.overlayNote}>
            This map view shows where the ad space is located, not the ad face.
          </Txt>
        ) : null}
      </View>
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
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: withAlpha('#000000', 0.28),
  },
  overlayText: {
    marginBottom: 2,
  },
  overlayNote: {
    opacity: 0.85,
  },
});
