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

export interface InfoRequest {
  id: string;
  listingId?: string;
  listingTitle?: string;
  name: string;
  email: string;
  message: string;
  weeks?: number;
  units?: number;
  createdAt: number;
}

const MAX_COMPARE = 4;

interface AppState {
  favorites: string[];
  compareIds: string[];
  filters: Filters;
  requests: InfoRequest[];

  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  setFilters: (patch: Partial<Filters>) => void;
  toggleFormat: (f: AdFormat) => void;
  toggleMarket: (m: MarketTier) => void;
  resetFilters: () => void;

  addRequest: (req: Omit<InfoRequest, 'id' | 'createdAt'>) => void;
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
    (set, get) => ({
      favorites: [],
      compareIds: [],
      filters: defaultFilters,
      requests: [],

      toggleFavorite: (id) => set((s) => ({ favorites: toggle(s.favorites, id) })),
      isFavorite: (id) => get().favorites.includes(id),

      toggleCompare: (id) =>
        set((s) => {
          if (s.compareIds.includes(id)) {
            return { compareIds: s.compareIds.filter((v) => v !== id) };
          }
          if (s.compareIds.length >= MAX_COMPARE) return s;
          return { compareIds: [...s.compareIds, id] };
        }),
      clearCompare: () => set({ compareIds: [] }),

      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      toggleFormat: (f) => set((s) => ({ filters: { ...s.filters, formats: toggle(s.filters.formats, f) } })),
      toggleMarket: (m) => set((s) => ({ filters: { ...s.filters, markets: toggle(s.filters.markets, m) } })),
      resetFilters: () => set({ filters: defaultFilters }),

      addRequest: (req) =>
        set((s) => ({
          requests: [
            { ...req, id: `req-${Date.now()}`, createdAt: Date.now() },
            ...s.requests,
          ],
        })),
    }),
    {
      name: 'adspace-store',
      storage,
      partialize: (s) => ({
        favorites: s.favorites,
        compareIds: s.compareIds,
        filters: s.filters,
        requests: s.requests,
      }),
    },
  ),
);

export const MAX_COMPARE_ITEMS = MAX_COMPARE;
