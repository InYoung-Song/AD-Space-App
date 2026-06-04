import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { Txt } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { LISTINGS } from '@/data/listings';
import { useTheme } from '@/hooks/use-theme';
import { MAX_COMPARE_ITEMS, useAppStore } from '@/lib/store';
import { useUserData } from '@/lib/user-data';

export default function SavedScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { favorites } = useUserData();
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);

  const saved = useMemo(() => LISTINGS.filter((l) => favorites.includes(l.id)), [favorites]);

  if (saved.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background, paddingTop: insets.top }]}>
        <View style={[styles.emptyIcon, { backgroundColor: t.accentSoft }]}>
          <Ionicons name="heart-outline" size={32} color={t.accent} />
        </View>
        <Txt variant="title" center>
          No saved spaces yet
        </Txt>
        <Txt variant="body" muted center style={{ maxWidth: 280 }}>
          Tap the heart on any space to save it here, then compare your shortlist.
        </Txt>
        <Button title="Browse spaces" icon="grid-outline" onPress={() => router.push('/browse')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background, paddingTop: insets.top }}>
      <FlatList
        data={saved}
        keyExtractor={(l) => l.id}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View style={{ marginBottom: Spacing.md }}>
            <Txt variant="title">Saved</Txt>
            <Txt variant="small" muted>
              {saved.length} space{saved.length === 1 ? '' : 's'} · select up to {MAX_COMPARE_ITEMS} to compare
            </Txt>
          </View>
        }
        renderItem={({ item }) => {
          const inCompare = compareIds.includes(item.id);
          return (
            <View style={{ marginBottom: Spacing.lg }}>
              <ListingCard listing={item} />
              <Pressable
                onPress={() => toggleCompare(item.id)}
                style={[
                  styles.compareToggle,
                  { borderColor: inCompare ? t.accent : t.border, backgroundColor: inCompare ? t.accentSoft : t.surface },
                ]}>
                <Ionicons
                  name={inCompare ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={inCompare ? t.accent : t.textSecondary}
                />
                <Txt variant="small" weight="semibold" color={inCompare ? t.accent : t.textSecondary}>
                  {inCompare ? 'Selected for compare' : 'Add to compare'}
                </Txt>
              </Pressable>
            </View>
          );
        }}
      />

      {compareIds.length > 0 ? (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 10, backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Pressable onPress={clearCompare} hitSlop={8}>
            <Txt variant="small" weight="semibold" color={t.textSecondary}>
              Clear ({compareIds.length})
            </Txt>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Button
            title={`Compare ${compareIds.length}`}
            icon="git-compare-outline"
            size="sm"
            disabled={compareIds.length < 2}
            onPress={() => router.push('/compare')}
          />
        </View>
      ) : null}
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
  compareToggle: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
