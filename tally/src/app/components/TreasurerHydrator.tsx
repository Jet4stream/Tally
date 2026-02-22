"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useTreasurerStore } from "@/store/treasurerStore";

export default function TreasurerHydrator() {
  const { user, isLoaded } = useUser();

  const hydrate = useTreasurerStore((s) => s.hydrate);
  const refresh = useTreasurerStore((s) => s.refresh);
  const clear = useTreasurerStore((s) => s.clear);

  useEffect(() => {
    if (!isLoaded) return;

    // logged out -> wipe store
    if (!user) {
      clear();
      return;
    }

    // logged in -> fetch every time a (new) user logs in
    // if you want to ALWAYS refetch on login, use refresh:
    refresh(user.id);

    // if you want to fetch only if missing, use hydrate(user.id) instead
    // hydrate(user.id);
  }, [isLoaded, user?.id, refresh, clear]);

  return null;
}