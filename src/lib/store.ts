import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { AdFormat, MarketTier } from '@/data/types';

export interface Filters {
  formats: AdFormat[];
  markets: MarketTier[];
  /** Max 4-week media estimate; undefined = no cap. */
  maxMonthly?: number;
  query: string;
}

const MAX_COMPARE = 4;

export type ThemeMode = 'system' | 'light' | 'dark';

interface AppState {
  /** Ephemeral compare selection (device-local). */
  compareIds: string[];
  filters: Filters;
  themeMode: ThemeMode;

  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  setFilters: (patch: Partial<Filters>) => void;
  toggleFormat: (f: AdFormat) => void;
  toggleMarket: (m: MarketTier) => void;
  resetFilters: () => void;

  setThemeMode: (mode: ThemeMode) => void;
}

const defaultFilters: Filters = { formats: [], markets: [], maxMonthly: undefined, query: '' };

// In-memory fallback so prerender / non-browser environments don't crash.
const memoryStore = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (k) => memoryStore.get(k) ?? null,
  setItem: (k, v) => void memoryStore.set(k, v),
  removeItem: (k) => void memoryStore.delete(k),
};

const webStorage: StateStorage =
  typeof window !== 'undefined' && window.localStorage ? window.localStorage : memoryStorage;

const storage = createJSONStorage(() => (Platform.OS === 'web' ? webStorage : AsyncStorage));

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      compareIds: [],
      filters: defaultFilters,
      themeMode: 'system',

      setThemeMode: (mode) => set({ themeMode: mode }),

      toggleCompare: (id) =>
        set((s) => {
          if (s.compareIds.includes(id)) return { compareIds: s.compareIds.filter((v) => v !== id) };
          if (s.compareIds.length >= MAX_COMPARE) return s;
          return { compareIds: [...s.compareIds, id] };
        }),
      clearCompare: () => set({ compareIds: [] }),

      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      toggleFormat: (f) => set((s) => ({ filters: { ...s.filters, formats: toggle(s.filters.formats, f) } })),
      toggleMarket: (m) => set((s) => ({ filters: { ...s.filters, markets: toggle(s.filters.markets, m) } })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'adspace-store',
      storage,
      partialize: (s) => ({ compareIds: s.compareIds, filters: s.filters, themeMode: s.themeMode }),
    },
  ),
);

export const MAX_COMPARE_ITEMS = MAX_COMPARE;
