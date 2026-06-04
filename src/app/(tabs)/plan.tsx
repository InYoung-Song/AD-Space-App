import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { FilterBar } from '@/components/filter-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Txt } from '@/components/ui/text';
import { withAlpha } from '@/components/ui/badge';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { FORMATS } from '@/data/formats';
import { LISTINGS } from '@/data/listings';
import type { Listing } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { buildPlan, fittingSpaces } from '@/lib/budget';
import { filterListings } from '@/lib/filtering';
import { formatCurrency, formatImpressions } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { useUserData } from '@/lib/user-data';

const DURATIONS = [
  { weeks: 4, label: '4 wks' },
  { weeks: 8, label: '8 wks' },
  { weeks: 12, label: '12 wks' },
  { weeks: 26, label: '6 mo' },
  { weeks: 52, label: '1 yr' },
];
const PRESETS = [5000, 10000, 25000, 50000];

export default function PlanScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const filters = useAppStore((s) => s.filters);

  const { savePlan } = useUserData();
  const [budgetText, setBudgetText] = useState('10000');
  const [weeks, setWeeks] = useState(4);
  const [saved, setSaved] = useState(false);

  const budget = Number(budgetText.replace(/[^0-9.]/g, '')) || 0;

  const base = useMemo(
    () => filterListings(LISTINGS, { ...filters, query: '', maxMonthly: undefined }),
    [filters],
  );
  const fits = useMemo(() => fittingSpaces(base, budget, weeks), [base, budget, weeks]);
  const plan = useMemo(() => buildPlan(base, budget, weeks), [base, budget, weeks]);

  useEffect(() => setSaved(false), [budget, weeks, base]);

  async function handleSave() {
    await savePlan({
      name: `${formatCurrency(budget, true)} · ${weeks} wks`,
      budget,
      weeks,
      totalCost: plan.totalCost,
      totalImpressions: plan.totalImpressions,
      items: plan.items.map((s) => ({ listingId: s.listing.id, cost: s.cost, impressions: s.impressions })),
    });
    setSaved(true);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 40 }]}>
      <View>
        <Txt variant="title">Plan by budget</Txt>
        <Txt variant="small" muted>
          See the most reach you can get for your spend
        </Txt>
      </View>

      <Card padded style={{ gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Txt variant="label" muted>
            YOUR BUDGET
          </Txt>
          <View style={[styles.budgetInput, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Txt variant="title" color={t.textMuted}>
              $
            </Txt>
            <TextInput
              value={budgetText}
              onChangeText={setBudgetText}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor={t.textMuted}
              style={[styles.budgetText, { color: t.text }]}
            />
          </View>
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <Chip key={p} label={formatCurrency(p, true)} selected={budget === p} onPress={() => setBudgetText(String(p))} />
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Txt variant="label" muted>
            DURATION
          </Txt>
          <View style={styles.presetRow}>
            {DURATIONS.map((d) => (
              <Chip key={d.weeks} label={d.label} selected={weeks === d.weeks} onPress={() => setWeeks(d.weeks)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Txt variant="label" muted>
            FORMATS (OPTIONAL)
          </Txt>
          <FilterBar />
        </View>
      </Card>

      {budget > 0 && plan.items.length > 0 ? (
        <Card padded style={{ gap: 12, borderColor: withAlpha(t.accent, 0.4), backgroundColor: withAlpha(t.accent, 0.06) }}>
          <View style={styles.planHead}>
            <View style={[styles.planIcon, { backgroundColor: t.accentSoft }]}>
              <Ionicons name="layers-outline" size={18} color={t.accentSoftText} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="subtitle">Recommended mix</Txt>
              <Txt variant="small" muted>
                Most reach within {formatCurrency(budget, true)} for {weeks} wks
              </Txt>
            </View>
          </View>

          <View style={styles.statRow}>
            <PlanStat label="Spaces" value={String(plan.items.length)} t={t} />
            <PlanStat label="Est. reach" value={`${formatImpressions(plan.totalImpressions)}`} t={t} />
            <PlanStat label="Est. spend" value={formatCurrency(plan.totalCost, true)} t={t} />
          </View>

          <View style={{ gap: 8 }}>
            {plan.items.map((s) => (
              <SpaceRow key={s.listing.id} listing={s.listing} cost={s.cost} impressions={s.impressions} t={t} highlight />
            ))}
          </View>

          <Button
            title={saved ? 'Saved to your account' : 'Save this plan'}
            icon={saved ? 'checkmark' : 'bookmark-outline'}
            variant={saved ? 'secondary' : 'primary'}
            onPress={handleSave}
            disabled={saved}
            fullWidth
          />
        </Card>
      ) : budget > 0 ? (
        <Card padded style={{ alignItems: 'center', gap: 8 }}>
          <Ionicons name="alert-circle-outline" size={28} color={t.textMuted} />
          <Txt variant="subtitle" center>
            Nothing fits {formatCurrency(budget, true)} yet
          </Txt>
          <Txt variant="small" muted center>
            Try a larger budget, a shorter duration, or different formats.
          </Txt>
        </Card>
      ) : null}

      {fits.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Txt variant="heading">Spaces that fit ({fits.length})</Txt>
          {fits.map((s) => (
            <SpaceRow key={s.listing.id} listing={s.listing} cost={s.cost} impressions={s.impressions} t={t} />
          ))}
        </View>
      ) : null}

      <Disclaimer />
    </ScrollView>
  );
}

function PlanStat({ label, value, t }: { label: string; value: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.planStat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Txt variant="subtitle" color={t.accent}>
        {value}
      </Txt>
      <Txt variant="label" muted>
        {label.toUpperCase()}
      </Txt>
    </View>
  );
}

function SpaceRow({
  listing,
  cost,
  impressions,
  t,
  highlight,
}: {
  listing: Listing;
  cost: number;
  impressions: number;
  t: ReturnType<typeof useTheme>;
  highlight?: boolean;
}) {
  const router = useRouter();
  const fmt = FORMATS[listing.format];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
      style={[
        styles.row,
        { borderColor: t.border, backgroundColor: highlight ? t.surface : 'transparent' },
      ]}>
      <View style={[styles.dot, { backgroundColor: fmt.color }]}>
        <Ionicons name={fmt.icon} size={14} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="small" weight="semibold" numberOfLines={1}>
          {listing.title}
        </Txt>
        <Txt variant="label" muted>
          {listing.city}, {listing.state} · {formatImpressions(impressions)} views
        </Txt>
      </View>
      <Txt variant="small" weight="bold" color={t.accent}>
        {formatCurrency(cost, true)}
      </Txt>
      <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  budgetInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 56,
  },
  budgetText: { flex: 1, fontSize: 26, fontWeight: '700', height: '100%' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', gap: 8 },
  planStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
