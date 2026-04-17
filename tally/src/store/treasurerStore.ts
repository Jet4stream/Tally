// src/store/treasurerStore.ts
"use client";

import { create } from "zustand";
import type { ClubMembershipWithUser } from "@/types/clubMembership";
import { getTreasurerClubMembers } from "@/lib/api/clubMembership";
import { getUserByClerkId } from "@/lib/api/user";

type TreasurerState = {
  treasurerClubId: string | null;
  memberships: ClubMembershipWithUser[];
  isTCU: boolean;
  loading: boolean;
  error: string | null;

  hydrate: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  clear: () => void;
};

export const useTreasurerStore = create<TreasurerState>((set, get) => ({
  treasurerClubId: null,
  memberships: [],
  isTCU: false,
  loading: false,
  error: null,

  hydrate: async (userId) => {
    // don't refetch if we already have data
    const { treasurerClubId, memberships, loading } = get();
    if (loading) return;
    if (treasurerClubId && memberships.length > 0) return;

    set({ loading: true, error: null });
    try {
      const [data, dbUser] = await Promise.all([
        getTreasurerClubMembers(userId).catch(() => null),
        getUserByClerkId(userId),
      ]);
      set({
        treasurerClubId: data?.clubId ?? null,
        memberships: data?.memberships ?? [],
        isTCU: dbUser?.role === "TCU_TREASURER",
        loading: false,
      });
    } catch (e) {
      set({
        treasurerClubId: null,
        memberships: [],
        isTCU: false,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load treasurer info",
      });
    }
  },

  refresh: async (userId) => {
    set({ loading: true, error: null });
    try {
      const [data, dbUser] = await Promise.all([
        getTreasurerClubMembers(userId).catch(() => null),
        getUserByClerkId(userId),
      ]);
      set({
        treasurerClubId: data?.clubId ?? null,
        memberships: data?.memberships ?? [],
        isTCU: dbUser?.role === "TCU_TREASURER",
        loading: false,
      });
    } catch (e) {
      set({
        treasurerClubId: null,
        memberships: [],
        isTCU: false,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to refresh treasurer info",
      });
    }
  },

  clear: () => set({ treasurerClubId: null, memberships: [], isTCU: false, loading: false, error: null }),
}));