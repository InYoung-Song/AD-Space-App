import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { ListingCard } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Txt } from '@/components/ui/text';
import { withAlpha } from '@/components/ui/badge';
import { Gradients, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { LISTINGS } from '@/data/listings';
import { useTheme } from '@/hooks/use-theme';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'location-outline', title: 'Find spaces', body: 'Search any US city or use your location to see real billboard spots.' },
  { icon: 'calculator-outline', title: 'Estimate cost', body: 'See reach and a transparent price range for each space — no sales call.' },
  { icon: 'wallet-outline', title: 'Plan a budget', body: 'Enter a budget and get the most cost-effective mix of spaces.' },
];

export default function HomeScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const stats = useMemo(() => {
    const states = new Set(LISTINGS.map((l) => l.state)).size;
    return { count: LISTINGS.length, states };
  }, []);
  const featured = useMemo(() => LISTINGS.slice(0, 4), []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <LinearGradient
        colors={Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 36 }]}>
        <View style={styles.heroInner}>
          <View style={styles.logoRow}>
            <View style={styles.logo}>
              <Ionicons name="megaphone" size={20} color="#fff" />
            </View>
            <Txt weight="bold" color="#fff" style={{ fontSize: 18 }}>
              AD Space
            </Txt>
          </View>
          <Txt variant="display" color="#fff" style={{ marginTop: 18 }}>
            Find where your ad can go.
          </Txt>
          <Txt variant="body" color="rgba(255,255,255,0.88)" style={{ marginTop: 8 }}>
            Browse real out-of-home advertising spaces across the US and get an honest cost estimate —
            no salesperson, no commitment.
          </Txt>
          <View style={styles.ctaRow}>
            <Button title="Browse spaces" icon="grid-outline" onPress={() => router.push('/browse')} />
            <Button title="Open map" icon="map-outline" variant="secondary" onPress={() => router.push('/map')} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <Stat value={`${stats.count}`} label="Spaces" t={t} />
          <Stat value={`${stats.states}`} label="States + DC" t={t} />
          <Stat value="Free" label="To browse" t={t} />
        </View>

        <View style={{ gap: 10 }}>
          {STEPS.map((s) => (
            <Card key={s.title} padded style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: withAlpha(t.accent, 0.14) }]}>
                <Ionicons name={s.icon} size={20} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="subtitle">{s.title}</Txt>
                <Txt variant="small" muted>
                  {s.body}
                </Txt>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Txt variant="heading">Featured locations</Txt>
          <Txt variant="small" weight="semibold" color={t.accent} onPress={() => router.push('/browse')}>
            See all
          </Txt>
        </View>
        <View style={{ gap: Spacing.md }}>
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </View>

        <Disclaimer />
      </View>
    </ScrollView>
  );
}

function Stat({ value, label, t }: { value: string; label: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Txt variant="title" color={t.accent}>
        {value}
      </Txt>
      <Txt variant="label" muted>
        {label.toUpperCase()}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  heroInner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  body: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 16,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
