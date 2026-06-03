import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Txt } from '@/components/ui/text';
import { withAlpha } from '@/components/ui/badge';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { FORMAT_LIST } from '@/data/formats';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/lib/store';

export default function MoreScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const requests = useAppStore((s) => s.requests);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.brandRow}>
        <View style={[styles.logo, { backgroundColor: t.accent }]}>
          <Ionicons name="megaphone-outline" size={22} color={t.accentText} />
        </View>
        <View>
          <Txt variant="title">AD Space</Txt>
          <Txt variant="small" muted>
            Discover & estimate out-of-home advertising
          </Txt>
        </View>
      </View>

      <Card padded style={{ gap: 10 }}>
        <Row icon="calculator-outline" tint={t.accent} title="How estimates work" />
        <Txt variant="small" muted>
          Each estimate uses standard OOH math — no guesswork:
        </Txt>
        <View style={[styles.formula, { backgroundColor: t.surfaceSelected }]}>
          <Txt variant="small" weight="semibold">
            impressions = daily reach (DEC) × days
          </Txt>
          <Txt variant="small" weight="semibold">
            cost = (impressions ÷ 1,000) × CPM
          </Txt>
        </View>
        <Txt variant="small" muted>
          CPM (cost per 1,000 views) is scaled by market size, and we show a ±15% range plus any
          one-time production cost. Figures are illustrative averages drawn from public 2025 OOH data.
        </Txt>
      </Card>

      <Card padded style={{ gap: 10 }}>
        <Row icon="pricetags-outline" tint="#2FB67C" title="Baseline CPM by format" />
        {FORMAT_LIST.map((f) => (
          <View key={f.id} style={styles.fmtRow}>
            <View style={styles.fmtLeft}>
              <View style={[styles.dot, { backgroundColor: f.color }]} />
              <Txt variant="small">{f.label}</Txt>
            </View>
            <Txt variant="small" muted>
              {formatCurrency(f.baseCpm)} CPM
            </Txt>
          </View>
        ))}
      </Card>

      <Card padded style={{ gap: 8 }}>
        <Row icon="bookmark-outline" tint="#E5B83B" title="Your saved interest" />
        <Txt variant="small" muted>
          {requests.length === 0
            ? 'No saved requests yet. Use “Save my interest” on a listing to keep a note here.'
            : `${requests.length} saved request${requests.length === 1 ? '' : 's'} stored on this device.`}
        </Txt>
        {requests.slice(0, 4).map((r) => (
          <View key={r.id} style={[styles.reqRow, { borderColor: t.border }]}>
            <Ionicons name="document-text-outline" size={16} color={t.textMuted} />
            <Txt variant="small" numberOfLines={1} style={{ flex: 1 }}>
              {r.listingTitle ?? 'General enquiry'}
            </Txt>
            <Txt variant="small" muted>
              {new Date(r.createdAt).toLocaleDateString()}
            </Txt>
          </View>
        ))}
      </Card>

      <Card padded style={{ gap: 8, backgroundColor: withAlpha(t.warning, 0.08), borderColor: withAlpha(t.warning, 0.3) }}>
        <Row icon="shield-checkmark-outline" tint={t.warning} title="Important — what this app is" />
        <Txt variant="small" muted>
          AD Space is an informational directory and planning tool. It does not sell, broker, or book
          advertising space, and the listings, vendors, and prices shown are illustrative samples — not
          live inventory or quotes. Always confirm availability and rates with the media owner directly.
        </Txt>
      </Card>

      <Txt variant="small" muted center style={{ marginTop: 8 }}>
        Built with Expo · Maps © OpenFreeMap & OpenStreetMap contributors
      </Txt>
    </ScrollView>
  );
}

function Row({ icon, tint, title }: { icon: keyof typeof Ionicons.glyphMap; tint: string; title: string }) {
  return (
    <View style={styles.rowHead}>
      <View style={[styles.rowIcon, { backgroundColor: withAlpha(tint, 0.16) }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Txt variant="subtitle">{title}</Txt>
    </View>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  logo: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  formula: { padding: 12, borderRadius: Radius.md, gap: 4 },
  fmtRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fmtLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
