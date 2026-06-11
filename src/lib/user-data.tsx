import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useAuth } from './auth';
import { withRetry } from './retry';
import { supabase } from './supabase';

export interface InfoRequest {
  id: string;
  listingId?: string | null;
  listingTitle?: string | null;
  name: string;
  email: string;
  message?: string | null;
  weeks?: number | null;
  units?: number | null;
  createdAt: string;
}

export interface SavedPlanItem {
  listingId: string;
  cost: number;
  impressions: number;
}

export interface SavedPlan {
  id: string;
  name: string;
  budget: number;
  weeks: number;
  totalCost: number;
  totalImpressions: number;
  items: SavedPlanItem[];
  createdAt: string;
}

interface UserDataState {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  requests: InfoRequest[];
  /** Resolves true on success; false (with a toast) on failure. */
  addRequest: (r: Omit<InfoRequest, 'id' | 'createdAt'>) => Promise<boolean>;
  plans: SavedPlan[];
  /** Resolves true on success; false (with a toast) on failure. */
  savePlan: (p: Omit<SavedPlan, 'id' | 'createdAt'>) => Promise<boolean>;
  deletePlan: (id: string) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserDataContext = createContext<UserDataState | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const { show } = useToast();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client || !userId) {
      setFavorites([]);
      setRequests([]);
      setPlans([]);
      return;
    }
    setLoading(true);
    try {
      const [favRes, reqRes, planRes] = await Promise.all([
        client.from('favorites').select('listing_id').eq('user_id', userId),
        client.from('info_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        client.from('saved_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      setFavorites((favRes.data ?? []).map((r) => r.listing_id as string));
      setRequests(
        (reqRes.data ?? []).map((r) => ({
          id: r.id,
          listingId: r.listing_id,
          listingTitle: r.listing_title,
          name: r.name,
          email: r.email,
          message: r.message,
          weeks: r.weeks,
          units: r.units,
          createdAt: r.created_at,
        })),
      );
      setPlans(
        (planRes.data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          budget: Number(r.budget),
          weeks: r.weeks,
          totalCost: Number(r.total_cost),
          totalImpressions: Number(r.total_impressions),
          items: (r.items ?? []) as SavedPlanItem[],
          createdAt: r.created_at,
        })),
      );
    } catch {
      // Network/transient failure — don't get stuck in a loading state.
      show('Couldn’t load your saved data. Check your connection.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [userId, show]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const client = supabase;
      if (!client || !userId) return;
      const had = favorites.includes(id);
      // optimistic
      setFavorites((prev) => (had ? prev.filter((x) => x !== id) : [...prev, id]));
      try {
        await withRetry(async () => {
          const { error } = had
            ? await client.from('favorites').delete().eq('user_id', userId).eq('listing_id', id)
            : await client.from('favorites').insert({ user_id: userId, listing_id: id });
          if (error) throw error;
        });
      } catch {
        // revert on failure, then warn
        setFavorites((prev) => (had ? [...prev, id] : prev.filter((x) => x !== id)));
        show('Couldn’t update your saved spaces.', { type: 'error' });
      }
    },
    [favorites, userId, show],
  );

  const addRequest = useCallback(
    async (r: Omit<InfoRequest, 'id' | 'createdAt'>): Promise<boolean> => {
      const client = supabase;
      if (!client || !userId) return false;
      try {
        const data = await withRetry(async () => {
          const { data, error } = await client
            .from('info_requests')
            .insert({
              user_id: userId,
              listing_id: r.listingId,
              listing_title: r.listingTitle,
              name: r.name,
              email: r.email,
              message: r.message,
              weeks: r.weeks,
              units: r.units,
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        });
        if (data) {
          setRequests((prev) => [
            {
              id: data.id,
              listingId: data.listing_id,
              listingTitle: data.listing_title,
              name: data.name,
              email: data.email,
              message: data.message,
              weeks: data.weeks,
              units: data.units,
              createdAt: data.created_at,
            },
            ...prev,
          ]);
        }
        return true;
      } catch {
        show('Couldn’t send your request. Check your connection and try again.', { type: 'error' });
        return false;
      }
    },
    [userId, show],
  );

  const savePlan = useCallback(
    async (p: Omit<SavedPlan, 'id' | 'createdAt'>): Promise<boolean> => {
      const client = supabase;
      if (!client || !userId) return false;
      try {
        const data = await withRetry(async () => {
          const { data, error } = await client
            .from('saved_plans')
            .insert({
              user_id: userId,
              name: p.name,
              budget: p.budget,
              weeks: p.weeks,
              total_cost: p.totalCost,
              total_impressions: p.totalImpressions,
              items: p.items,
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        });
        if (data) {
          setPlans((prev) => [
            {
              id: data.id,
              name: data.name,
              budget: Number(data.budget),
              weeks: data.weeks,
              totalCost: Number(data.total_cost),
              totalImpressions: Number(data.total_impressions),
              items: (data.items ?? []) as SavedPlanItem[],
              createdAt: data.created_at,
            },
            ...prev,
          ]);
        }
        return true;
      } catch {
        show('Couldn’t save your plan. Check your connection and try again.', { type: 'error' });
        return false;
      }
    },
    [userId, show],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      const client = supabase;
      if (!client || !userId) return;
      const removed = plans.find((p) => p.id === id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      try {
        await withRetry(async () => {
          const { error } = await client.from('saved_plans').delete().eq('user_id', userId).eq('id', id);
          if (error) throw error;
        });
      } catch {
        // restore the row we optimistically removed, then warn
        if (removed) setPlans((prev) => [removed, ...prev]);
        show('Couldn’t delete the plan.', { type: 'error' });
      }
    },
    [plans, userId, show],
  );

  return (
    <UserDataContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, requests, addRequest, plans, savePlan, deletePlan, loading, refresh }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData(): UserDataState {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within a UserDataProvider');
  return ctx;
}
