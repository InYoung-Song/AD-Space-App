import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { geocode, type GeoResult } from '@/lib/geocode';
import { cardShadow } from './ui/card';
import { Txt } from './ui/text';

export function LocationSearch({ onSelect }: { onSelect: (r: GeoResult) => void }) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    const id = setTimeout(async () => {
      ctrl.current?.abort();
      const controller = new AbortController();
      ctrl.current = controller;
      try {
        const r = await geocode(q, controller.signal);
        if (controller.signal.aborted) return;
        setResults(r);
        setOpen(true);
      } catch {
        // Ignore aborts from a newer keystroke; surface real failures as retryable.
        if (controller.signal.aborted) return;
        setResults([]);
        setFailed(true);
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [query, retryNonce]);

  function pick(r: GeoResult) {
    onSelect(r);
    setQuery(r.label);
    setOpen(false);
    setResults([]);
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search" size={18} color={t.textMuted} />
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setOpen(true);
          }}
          placeholder="Search a city, address, or place"
          placeholderTextColor={t.textMuted}
          style={[styles.input, { color: t.text }]}
          returnKeyType="search"
          autoCapitalize="words"
        />
        {loading ? (
          <ActivityIndicator size="small" color={t.textMuted} />
        ) : query ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={t.textMuted}
            onPress={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
              setFailed(false);
            }}
          />
        ) : null}
      </View>

      {open && failed ? (
        <View style={[styles.dropdown, { backgroundColor: t.surface, borderColor: t.border }, cardShadow]}>
          <Pressable onPress={() => setRetryNonce((n) => n + 1)} style={styles.item}>
            <Ionicons name="refresh" size={16} color={t.danger} />
            <Txt variant="small" color={t.danger} style={{ flex: 1 }}>
              Couldn’t search just now — tap to retry.
            </Txt>
          </Pressable>
        </View>
      ) : open && results.length > 0 ? (
        <View style={[styles.dropdown, { backgroundColor: t.surface, borderColor: t.border }, cardShadow]}>
          {results.map((r, i) => (
            <Pressable
              key={`${r.lat},${r.lng},${i}`}
              onPress={() => pick(r)}
              style={[styles.item, i > 0 && { borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Ionicons name="location-outline" size={16} color={t.textMuted} />
              <Txt variant="small" numberOfLines={1} style={{ flex: 1 }}>
                {r.label}
              </Txt>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 20 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 46,
  },
  input: { flex: 1, fontSize: 15, height: '100%' },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    overflow: 'hidden',
    zIndex: 30,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11 },
});
