"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import MemberTopBar from "@/app/components/MemberTopBar";
import TreasuryMemberViewBar from "@/app/components/TreasuryMemberViewBar";
import MemberDashboard from "@/app/components/MemberDashboard";

export default function Page() {
  const { user, isLoaded } = useUser();
  const [isTreasurer, setIsTreasurer] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    fetch(`/api/clubMemberships?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const hasTreasurer = data.data?.some(
          (m: any) => m.role === "TREASURER"
        );
        setIsTreasurer(hasTreasurer);
      });
  }, [isLoaded, user?.id]);

  return (
    <div className="pt-[64px] sm:pt-[80px] lg:pt-[100px]">
      <MemberTopBar />
      {isTreasurer && <TreasuryMemberViewBar />}
      <MemberDashboard />
    </div>
  );
}