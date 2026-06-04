import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, type Theme } from '@/constants/theme';
import { useEffectiveScheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UserDataProvider } from '@/lib/user-data';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserDataProvider>
            <Themed />
          </UserDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
