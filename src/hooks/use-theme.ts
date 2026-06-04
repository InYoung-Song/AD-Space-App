/**
 * Effective color scheme respects the user's manual choice (light/dark) and
 * falls back to the system setting when set to "system".
 */

import { Colors, type Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';

export function useEffectiveScheme(): 'light' | 'dark' {
  const mode = useAppStore((s) => s.themeMode);
  const system = useColorScheme();
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Theme {
  return Colors[useEffectiveScheme()];
}
