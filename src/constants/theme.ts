/**
 * Design tokens for AD Space App.
 * A modern, map-forward palette: confident electric-violet accent over neutral slate surfaces,
 * with full light + dark support. Consumed via the `useTheme()` hook.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B0B12',
    textSecondary: '#454A54',
    textMuted: '#7C828E',

    background: '#F6F7FB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSelected: '#EEEDFD',
    border: '#E6E8EF',

    accent: '#6D5DF6',
    accentText: '#FFFFFF',
    accentSoft: '#EEEBFF',
    accentSoftText: '#4B3FD0',

    success: '#149A6B',
    warning: '#C97A0E',
    danger: '#D14343',

    tabBar: '#FFFFFF',
    tabBarBorder: '#E6E8EF',
  },
  dark: {
    text: '#F4F5FA',
    textSecondary: '#B6BAC5',
    textMuted: '#80858F',

    background: '#0B0C10',
    surface: '#16181F',
    surfaceElevated: '#1D2029',
    surfaceSelected: '#262338',
    border: '#262A33',

    accent: '#8B7DF9',
    accentText: '#0B0C10',
    accentSoft: '#241F3D',
    accentSoftText: '#C4BCFB',

    success: '#3BD39A',
    warning: '#E2A23B',
    danger: '#F0726F',

    tabBar: '#101218',
    tabBarBorder: '#23262F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 32,
} as const;

export const MaxContentWidth = 900;
