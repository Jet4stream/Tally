"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import NavBar from "@/app/components/NavBar";
import TCUTabSpacer from "@/app/components/TabSpacerTCU";

import { useTreasurerStore } from "@/store/treasurerStore";
import { getUserById } from "@/lib/api/user"; 

export default function Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const treasurerClubId = useTreasurerStore((s) => s.treasurerClubId);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    // Not signed in at all
    if (!user?.id) {
      router.replace("/pages/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // 1) check DB role
        const dbUser = await getUserById(user.id);

        if (cancelled) return;

        if (dbUser?.role === "TCU_TREASURER") {
          setChecking(false); // allow access
          return;
        }

        // 2) not global TCU: route based on treasurer club state
        if (!treasurerClubId) {
          router.replace("/pages/members");
        } else {
          router.replace("/");
        }
      } catch (e) {
        // If we can't verify role, fail closed (send away)
        if (cancelled) return;

        if (!treasurerClubId) router.replace("/pages/members");
        else router.replace("/");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, treasurerClubId, router]);

  // check prevents flash of TCU page while redirecting/checking
  if (checking) {
  return (
    <div>
      {/* Sticky wrapper */}
      <div className="sticky top-0 z-50">
        <NavBar title="TCU Treasury" />
        <div className="px-4 sm:px-6 lg:px-[32px]">
          <p className="text-white/90">Checking access...</p>
        </div>
      </div>

  return (
    <div>
      <NavBar title="TCU Treasury" />
      <div>
        <TCUTabSpacer />
      </div>
    </div>
  );
}

return (
  <div>
    {/* Sticky wrapper */}
    <div className="sticky top-0 z-50">
      <NavBar title="TCU Treasury" />
      <TCUTabSpacer />
    </div>
  </div>
);
}