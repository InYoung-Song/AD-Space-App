import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { FORMATS } from '@/data/formats';
import type { Listing } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { estimate } from '@/lib/estimator';
import { formatCurrency, formatImpressions, formatRange } from '@/lib/format';
import { Chip } from './ui/chip';
import { Txt } from './ui/text';

interface Props {
  listing: Listing;
  weeks: number;
  units: number;
  onWeeks: (n: number) => void;
  onUnits: (n: number) => void;
}

const DURATIONS: { weeks: number; label: string }[] = [
  { weeks: 4, label: '4 wks' },
  { weeks: 8, label: '8 wks' },
  { weeks: 12, label: '12 wks' },
  { weeks: 26, label: '6 mo' },
  { weeks: 52, label: '1 yr' },
];

export function EstimatorPanel({ listing, weeks, units, onWeeks, onUnits }: Props) {
  const t = useTheme();
  const fmt = FORMATS[listing.format];
  const est = estimate({ listing, weeks, units });

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Txt variant="label" muted>
          CAMPAIGN LENGTH
        </Txt>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => (
            <Chip
              key={d.weeks}
              label={d.label}
              selected={weeks === d.weeks}
              onPress={() => onWeeks(d.weeks)}
            />
          ))}
        </View>
        {weeks < listing.minWeeks ? (
          <Txt variant="small" color={t.warning}>
            Minimum term for this space is {listing.minWeeks} weeks.
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="label" muted>
          NUMBER OF UNITS
        </Txt>
        <View style={[styles.stepper, { borderColor: t.border }]}>
          <StepBtn icon="remove" onPress={() => onUnits(Math.max(1, units - 1))} color={t.text} />
          <Txt variant="subtitle" style={{ minWidth: 40, textAlign: 'center' }}>
            {units}
          </Txt>
          <StepBtn icon="add" onPress={() => onUnits(Math.min(50, units + 1))} color={t.text} />
        </View>
      </View>

      <View style={[styles.breakdown, { borderColor: t.border }]}>
        <Row label="Effective CPM" value={`${formatCurrency(est.cpm)} / 1,000 views`} />
        <Row label="Est. total impressions" value={formatImpressions(est.totalImpressions)} />
        <Row label="Media cost" value={formatRange(est.mediaLow, est.mediaHigh)} />
        {est.productionCost > 0 ? (
          <Row label={`Production (one-time)`} value={formatCurrency(est.productionCost)} />
        ) : null}
        <View style={[styles.totalRow, { borderTopColor: t.border }]}>
          <View>
            <Txt weight="semibold">Estimated total</Txt>
            <Txt variant="small" muted>
              {units} unit{units > 1 ? 's' : ''} · {weeks} weeks
            </Txt>
          </View>
          <Txt variant="heading" color={t.accent}>
            {formatRange(est.totalLow, est.totalHigh, false)}
          </Txt>
        </View>
      </View>
    </View>
  );
}

function StepBtn({
  icon,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.stepBtn}>
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Txt variant="small" muted>
        {label}
      </Txt>
      <Txt variant="small" weight="semibold">
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: 6,
  },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  breakdown: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 2,
    gap: 12,
  },
});
