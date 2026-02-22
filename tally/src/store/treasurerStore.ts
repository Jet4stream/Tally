// src/store/treasurerStore.ts
"use client";

import { create } from "zustand";
import type { ClubMembershipWithUser } from "@/types/clubMembership";
import { getTreasurerClubMembers } from "@/lib/api/clubMembership";

type TreasurerState = {
  treasurerClubId: string | null;
  memberships: ClubMembershipWithUser[];
  loading: boolean;
  error: string | null;

  hydrate: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  clear: () => void;
};

export const useTreasurerStore = create<TreasurerState>((set, get) => ({
  treasurerClubId: null,
  memberships: [],
  loading: false,
  error: null,

  hydrate: async (userId) => {
    // don't refetch if we already have data
    const { treasurerClubId, memberships, loading } = get();
    if (loading) return;
    if (treasurerClubId && memberships.length > 0) return;

    set({ loading: true, error: null });
    try {
      const data = await getTreasurerClubMembers(userId);
      set({
        treasurerClubId: data?.clubId ?? null,
        memberships: data?.memberships ?? [],
        loading: false,
      });
    } catch (e: any) {
      set({
        treasurerClubId: null,
        memberships: [],
        loading: false,
        error: e?.message ?? "Failed to load treasurer info",
      });
    }
  },

  refresh: async (userId) => {
    set({ loading: true, error: null });
    try {
      const data = await getTreasurerClubMembers(userId);
      set({
        treasurerClubId: data?.clubId ?? null,
        memberships: data?.memberships ?? [],
        loading: false,
      });
    } catch (e: any) {
      set({
        treasurerClubId: null,
        memberships: [],
        loading: false,
        error: e?.message ?? "Failed to refresh treasurer info",
      });
    }
  },

  clear: () => set({ treasurerClubId: null, memberships: [], loading: false, error: null }),
}));