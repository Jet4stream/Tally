"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import MemberTopBar from "@/app/components/MemberTopBar";
import TreasuryMemberViewBar from "@/app/components/TreasuryMemberViewBar";
import MemberDashboard from "@/app/components/MemberDashboard";
import { getUserById } from "@/lib/api/user";

export default function Page() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [isTreasurer, setIsTreasurer] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user?.id) {
      router.replace("/pages/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const dbUser = await getUserById(user.id);

        if (cancelled) return;
        if (dbUser?.role === "TCU_TREASURER") {
          router.replace("/pages/tcu"); // or wherever your TCU dashboard is
          return;
        }

        // Optional: still check club treasurer for UI bar
        const res = await fetch(`/api/clubMemberships?userId=${user.id}`);
        const data = await res.json();

        const hasTreasurer = data.data?.some(
          (m: any) => m.role === "TREASURER"
        );

        setIsTreasurer(hasTreasurer);
      } catch (e) {
        router.replace("/");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, router]);

  if (checking) {
    return (
      <div className="p-6 text-black">
        Checking access...
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-50">
        <MemberTopBar />
        {isTreasurer && <TreasuryMemberViewBar />}
      </div>

      <div className="px-4 sm:px-6 lg:px-[32px] pt-[16px]">
        <p className="text-sm sm:text-base text-black font-[family-name:var(--font-pt-sans)]">
          Your club treasurers submitted the following reimbursements. Please reach out to them with any questions.
        </p>
      </div>

      <MemberDashboard />
    </div>
  );
}