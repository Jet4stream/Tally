"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import NavBar from "@/app/components/NavBar";
import TabSpacer from "@/app/components/TabSpacer";
import NewReimbursementButton from "@/app/components/NewReimbursementButton";
import { useTreasurerStore } from "@/store/treasurerStore";

export default function Page() {
  const router = useRouter();
  const treasurerClubId = useTreasurerStore((s) => s.treasurerClubId);

  useEffect(() => {
    // If no club selected / no club assigned → send to member page
    if (!treasurerClubId) {
      router.replace("/pages/members");
    }
  }, [treasurerClubId, router]);

  // Optional: prevent flicker while redirecting
  if (!treasurerClubId) return null;

  return (
    <div>
      <NavBar />
      <div className="mt-[64px] sm:mt-[80px] lg:mt-[100px]">
        <TabSpacer />
        <div className="px-4 sm:px-6 lg:px-[32px] mt-4">
          <NewReimbursementButton />
        </div>
      </div>
    </div>
  );
}