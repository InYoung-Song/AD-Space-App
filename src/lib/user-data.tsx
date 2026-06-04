import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
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
  addRequest: (r: Omit<InfoRequest, 'id' | 'createdAt'>) => Promise<void>;
  plans: SavedPlan[];
  savePlan: (p: Omit<SavedPlan, 'id' | 'createdAt'>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserDataContext = createContext<UserDataState | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setFavorites([]);
      setRequests([]);
      setPlans([]);
      return;
    }
    setLoading(true);
    const [favRes, reqRes, planRes] = await Promise.all([
      supabase.from('favorites').select('listing_id').eq('user_id', userId),
      supabase.from('info_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('saved_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
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
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!supabase || !userId) return;
      const had = favorites.includes(id);
      // optimistic
      setFavorites((prev) => (had ? prev.filter((x) => x !== id) : [...prev, id]));
      const { error } = had
        ? await supabase.from('favorites').delete().eq('user_id', userId).eq('listing_id', id)
        : await supabase.from('favorites').insert({ user_id: userId, listing_id: id });
      if (error) {
        // revert on failure
        setFavorites((prev) => (had ? [...prev, id] : prev.filter((x) => x !== id)));
      }
    },
    [favorites, userId],
  );

  const addRequest = useCallback(
    async (r: Omit<InfoRequest, 'id' | 'createdAt'>) => {
      if (!supabase || !userId) return;
      const { data } = await supabase
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
    },
    [userId],
  );

  const savePlan = useCallback(
    async (p: Omit<SavedPlan, 'id' | 'createdAt'>) => {
      if (!supabase || !userId) return;
      const { data } = await supabase
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
    },
    [userId],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      if (!supabase || !userId) return;
      setPlans((prev) => prev.filter((p) => p.id !== id));
      await supabase.from('saved_plans').delete().eq('user_id', userId).eq('id', id);
    },
    [userId],
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
