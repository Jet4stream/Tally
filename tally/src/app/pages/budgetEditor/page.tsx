"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import BudgetEditor from "@/app/components/BudgetEditor";
import { useTreasurerStore } from "@/store/treasurerStore";

const CURRENT_YEAR = 2026;

function BudgetEditorContent() {
  const router = useRouter();
  const params = useSearchParams();

  const clubId = params.get("clubId") ?? "";
  const year = parseInt(params.get("year") ?? "", 10);
  const clubName = params.get("clubName") ?? undefined;

  const treasurerClubId = useTreasurerStore((s) => s.treasurerClubId);
  const isTCU = useTreasurerStore((s) => s.isTCU);
  const storeLoading = useTreasurerStore((s) => s.loading);

  // TCU: current year only, any club
  // Treasurer: next year only, own club only
  // Others (treasurerClubId === null): never authorized
  const isAuthorized =
    !isNaN(year) &&
    !!clubId &&
    (isTCU
      ? year === CURRENT_YEAR || year === CURRENT_YEAR + 1
      : treasurerClubId === clubId && year === CURRENT_YEAR + 1);

  useEffect(() => {
    if (storeLoading) return;
    if (!isAuthorized) {
      router.back();
    }
  }, [storeLoading, isAuthorized, router]);

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-[family-name:var(--font-pt-sans)]">
        Loading…
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <BudgetEditor clubId={clubId} year={year} clubName={clubName} />;
}

export default function BudgetEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-gray-400 font-[family-name:var(--font-pt-sans)]">
          Loading…
        </div>
      }
    >
      <BudgetEditorContent />
    </Suspense>
  );
}
