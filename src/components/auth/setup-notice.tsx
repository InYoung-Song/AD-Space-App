import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Txt } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEPS = [
  'Create a free project at supabase.com.',
  'In the project, open SQL Editor and run the contents of supabase/schema.sql.',
  'Copy Project URL and the anon public key from Project Settings → API.',
  'Create a .env file in the project root (copy .env.example) and paste both values.',
  'Stop and restart the dev server so the new env vars load.',
];

export function SetupNotice() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
      <View style={[styles.icon, { backgroundColor: t.surfaceSelected }]}>
        <Ionicons name="server-outline" size={26} color={t.accent} />
      </View>
      <Txt variant="title" center>
        Connect Supabase to continue
      </Txt>
      <Txt variant="body" muted center>
        Accounts and saved data are stored in your own Supabase project. Add your keys to switch the
        app on.
      </Txt>

      <Card padded style={{ gap: 14, marginTop: 8 }}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.num, { backgroundColor: t.accentSoft }]}>
              <Txt variant="small" weight="bold" color={t.accentSoftText}>
                {i + 1}
              </Txt>
            </View>
            <Txt variant="small" style={{ flex: 1 }}>
              {s}
            </Txt>
          </View>
        ))}
      </Card>

      <View style={[styles.code, { backgroundColor: t.surfaceSelected, borderColor: t.border }]}>
        <Txt variant="small" weight="semibold" color={t.textSecondary}>
          EXPO_PUBLIC_SUPABASE_URL=…
        </Txt>
        <Txt variant="small" weight="semibold" color={t.textSecondary}>
          EXPO_PUBLIC_SUPABASE_ANON_KEY=…
        </Txt>
      </View>

      <Txt variant="small" muted center>
        For Google sign-in, also enable the Google provider in Supabase (Authentication → Providers).
      </Txt>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  code: { padding: 14, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, gap: 4, marginTop: 4 },
});
