import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Txt } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { FORMAT_LIST } from '@/data/formats';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatImpressions } from '@/lib/format';
import { useAppStore, type ThemeMode } from '@/lib/store';
import { useUserData } from '@/lib/user-data';

const MODES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function AccountScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { plans, deletePlan, requests } = useUserData();

  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);

  const name =
    (user?.user_metadata?.display_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    'Account';
  const initial = name.charAt(0).toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: t.accent }]}>
          <Txt variant="title" color={t.accentText}>
            {initial}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="heading" numberOfLines={1}>
            {name}
          </Txt>
          <Txt variant="small" muted numberOfLines={1}>
            {user?.email ?? ''}
          </Txt>
        </View>
      </View>

      <Card padded style={{ gap: 10 }}>
        <Txt variant="subtitle">Appearance</Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {MODES.map((m) => (
            <Chip key={m.id} label={m.label} selected={themeMode === m.id} onPress={() => setThemeMode(m.id)} />
          ))}
        </View>
      </Card>

      <Card padded style={{ gap: 12 }}>
        <View style={styles.rowHead}>
          <Txt variant="subtitle">Saved plans</Txt>
          <Txt variant="small" muted>
            {plans.length}
          </Txt>
        </View>
        {plans.length === 0 ? (
          <Txt variant="small" muted>
            Save a plan from the Plan tab to keep it here.
          </Txt>
        ) : (
          plans.map((p) => (
            <View key={p.id} style={[styles.planRow, { borderColor: t.border }]}>
              <View style={{ flex: 1 }}>
                <Txt variant="small" weight="semibold" numberOfLines={1}>
                  {p.name}
                </Txt>
                <Txt variant="label" muted>
                  {formatCurrency(p.budget, true)} · {p.weeks} wks · {p.items.length} spaces ·{' '}
                  {formatImpressions(p.totalImpressions)} reach
                </Txt>
              </View>
              <Ionicons name="trash-outline" size={18} color={t.textMuted} onPress={() => deletePlan(p.id)} />
            </View>
          ))
        )}
      </Card>

      <Card padded style={{ gap: 12 }}>
        <View style={styles.rowHead}>
          <Txt variant="subtitle">Requests</Txt>
          <Txt variant="small" muted>
            {requests.length}
          </Txt>
        </View>
        {requests.length === 0 ? (
          <Txt variant="small" muted>
            Notes you save with “Request info” appear here.
          </Txt>
        ) : (
          requests.slice(0, 6).map((r) => (
            <View key={r.id} style={[styles.planRow, { borderColor: t.border }]}>
              <Txt variant="small" numberOfLines={1} style={{ flex: 1 }}>
                {r.listingTitle ?? 'General enquiry'}
              </Txt>
              <Txt variant="label" muted>
                {new Date(r.createdAt).toLocaleDateString()}
              </Txt>
            </View>
          ))
        )}
      </Card>

      <Card padded style={{ gap: 8 }}>
        <Txt variant="subtitle">How estimates work</Txt>
        <Txt variant="small" muted>
          Each estimate uses standard out-of-home math: impressions = daily reach (DEC) × days, and
          cost = (impressions ÷ 1,000) × CPM, scaled by market size with a ±15% range. Figures are
          illustrative averages from public data, not quotes.
        </Txt>
        <View style={{ marginTop: 4, gap: 6 }}>
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
        </View>
      </Card>

      <Txt variant="small" muted>
        AD Space is an informational directory and planning tool. It does not sell or book advertising
        space; listings and prices are illustrative samples. Confirm rates with media owners directly.
      </Txt>

      <Button title="Sign out" variant="ghost" icon="log-out-outline" onPress={() => signOut()} fullWidth />

      <Txt variant="label" muted center>
        Maps © OpenFreeMap & OpenStreetMap contributors
      </Txt>
    </ScrollView>
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
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fmtRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fmtLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
