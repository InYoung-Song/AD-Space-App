import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui/toast';
import { Colors, type Theme } from '@/constants/theme';
import { useOnline } from '@/hooks/use-online';
import { useEffectiveScheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UserDataProvider } from '@/lib/user-data';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <UserDataProvider>
              <Themed />
            </UserDataProvider>
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Caught by Expo Router when any route subtree throws — replaces the white
 * screen of death with a recoverable error card. Uses only zustand-backed
 * theming so it can't itself depend on a crashed provider.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const c = Colors[useEffectiveScheme()];
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: c.background }}>
      <Ionicons name="warning-outline" size={40} color={c.warning} />
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Something went wrong</Text>
      <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 420 }}>
        The app hit an unexpected error. You can try again — your saved data is safe.
      </Text>
      {__DEV__ ? (
        <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 420 }}>{error.message}</Text>
      ) : null}
      <Pressable
        onPress={retry}
        style={{ marginTop: 8, backgroundColor: c.accent, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 }}>
        <Text style={{ color: c.accentText, fontWeight: '600' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

function OfflineBanner({ c }: { c: Theme }) {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingTop: insets.top, backgroundColor: c.warning }}>
      <Text style={{ textAlign: 'center', color: '#fff', paddingVertical: 6, fontSize: 13, fontWeight: '600' }}>
        You’re offline — changes may not save.
      </Text>
    </View>
  );
}

function Themed() {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const c = Colors[scheme];
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: c.background, card: c.surface, text: c.text, border: c.border, primary: c.accent },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Gate c={c} />
      <OfflineBanner c={c} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

function useProtectedRoute(session: unknown, loading: boolean) {
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    // Unconfigured or signed-out users are kept in the auth group, where the
    // sign-in screen shows either the form or the Supabase setup notice.
    const needsAuth = !isSupabaseConfigured || !session;
    if (needsAuth && !inAuthGroup) router.replace('/sign-in');
    else if (!needsAuth && inAuthGroup) router.replace('/');
  }, [session, loading, segments, router]);
}

function Gate({ c }: { c: Theme }) {
  const { session, loading } = useAuth();
  useProtectedRoute(session, loading);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerTintColor: c.accent, contentStyle: { backgroundColor: c.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ title: '', headerTransparent: true }} />
      <Stack.Screen name="compare" options={{ title: 'Compare spaces', presentation: 'modal' }} />
    </Stack>
  );
}
