import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Txt } from '@/components/ui/text';
import { Gradients, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SetupNotice } from './setup-notice';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const isSignUp = mode === 'signup';
  const [name, setName] = useState('');
  // Hooks must run before any early return; the notice is shown below.

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const valid =
    EMAIL_RE.test(email.trim()) && password.length >= 6 && (!isSignUp || name.trim().length > 1);

  async function submit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const { needsConfirmation } = await signUpWithEmail(email.trim(), password, name.trim());
        if (needsConfirmation) {
          setInfo('Check your email to confirm your account, then sign in.');
        }
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  if (!isSupabaseConfigured) return <SetupNotice />;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 40 }]}>
        <View style={styles.logo}>
          <Ionicons name="megaphone" size={26} color="#fff" />
        </View>
        <Txt variant="display" color="#fff">
          AD Space
        </Txt>
        <Txt variant="body" color="rgba(255,255,255,0.9)" center>
          {isSignUp ? 'Create an account to save and plan your campaigns.' : 'Welcome back — sign in to your spaces.'}
        </Txt>
      </LinearGradient>

      <View style={styles.body}>
        <Card padded style={[styles.card, { marginTop: -28 }]}>
          <Txt variant="title">{isSignUp ? 'Sign up' : 'Sign in'}</Txt>

          {isSignUp ? (
            <Field label="Name" icon="person-outline" t={t}>
              <TextInput value={name} onChangeText={setName} placeholder="Jane Doe" placeholderTextColor={t.textMuted} style={[styles.input, { color: t.text }]} />
            </Field>
          ) : null}

          <Field label="Email" icon="mail-outline" t={t}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={t.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { color: t.text }]}
            />
          </Field>

          <Field label="Password" icon="lock-closed-outline" t={t}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={t.textMuted}
              secureTextEntry
              style={[styles.input, { color: t.text }]}
            />
          </Field>

          {error ? (
            <Txt variant="small" color={t.danger}>
              {error}
            </Txt>
          ) : null}
          {info ? (
            <Txt variant="small" color={t.success}>
              {info}
            </Txt>
          ) : null}

          <Button title={isSignUp ? 'Create account' : 'Sign in'} onPress={submit} disabled={!valid} loading={loading} fullWidth />

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: t.border }]} />
            <Txt variant="label" muted>
              OR
            </Txt>
            <View style={[styles.line, { backgroundColor: t.border }]} />
          </View>

          <Pressable onPress={google} disabled={googleLoading} style={[styles.google, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Txt weight="semibold">{googleLoading ? 'Connecting…' : 'Continue with Google'}</Txt>
          </Pressable>

          <View style={styles.footer}>
            <Txt variant="small" muted>
              {isSignUp ? 'Already have an account?' : 'New here?'}
            </Txt>
            <Link href={isSignUp ? '/sign-in' : '/sign-up'} replace>
              <Txt variant="small" weight="semibold" color={t.accent}>
                {isSignUp ? 'Sign in' : 'Create an account'}
              </Txt>
            </Link>
          </View>
        </Card>
      </View>
    </View>
  );
}

function Field({
  label,
  icon,
  t,
  children,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  t: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" muted>
        {label.toUpperCase()}
      </Txt>
      <View style={[styles.inputWrap, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name={icon} size={18} color={t.textMuted} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingBottom: 48 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  body: { flex: 1, paddingHorizontal: Spacing.lg, maxWidth: 460, width: '100%', alignSelf: 'center' },
  card: { gap: 14 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, fontSize: 15, height: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
