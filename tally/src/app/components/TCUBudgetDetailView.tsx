"use client";

import { useState } from "react";
import Link from "next/link";
import BudgetSheet from "./TreasurerBudgetSheet";
import PendingClubReimbursements from "./PendingClubReimbursements";
import ReallocateBudget from "./ReallocateBudget";
import type { Club } from "@prisma/client";

const CURRENT_YEAR = 2026;

export default function TCUBudgetDetailView({ club, onBack }: { club: Club; onBack: () => void }) {
  const [activePanel, setActivePanel] = useState<"reimbursements" | "reallocate">("reimbursements");
  const [budgetKey, setBudgetKey] = useState(0);

  return (
    <div className="px-4 sm:px-6 lg:px-[32px] py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-[#3172AE] font-bold text-sm mb-4 hover:underline font-[family-name:var(--font-pt-sans)]"
        >
          ← Back to all clubs
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-semibold text-gray-900 leading-tight font-[family-name:var(--font-public-sans)]">
              {club.name}
            </h1>
            <p className="text-gray-900 font-medium font-[family-name:var(--font-public-sans)]">
              Dept ID: A901{club.deptId}
            </p>
          </div>
          <Link
            href={`/pages/budgetEditor?clubId=${club.id}&year=${CURRENT_YEAR}&clubName=${encodeURIComponent(club.name)}`}
            className="text-sm font-semibold text-[#3172AE] border border-[#3172AE] rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors font-[family-name:var(--font-public-sans)] whitespace-nowrap"
          >
            Edit {CURRENT_YEAR} Budget
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-end lg:flex-row lg:items-start gap-0">

        {/* Left: Main Budget Content */}
        <div className="flex-1 w-full min-w-0">
          <BudgetSheet key={budgetKey} forcedClubId={club.id} hideReallocate={true} />
        </div>

        {/* Right: Toggle Panel */}
        <div className="flex flex-col shrink-0">
          {/* Tab toggle */}
          <div className="flex border-b border-gray-200 ml-6 w-96">
            <button
              onClick={() => setActivePanel("reimbursements")}
              className={`flex-1 py-2 text-sm font-medium font-[family-name:var(--font-public-sans)] cursor-pointer ${
                activePanel === "reimbursements"
                  ? "border-b-2 border-[#3172AE] text-gray-900"
                  : "text-gray-400"
              }`}
            >
              Reimbursements
            </button>
            <button
              onClick={() => setActivePanel("reallocate")}
              className={`flex-1 py-2 text-sm font-medium font-[family-name:var(--font-public-sans)] cursor-pointer ${
                activePanel === "reallocate"
                  ? "border-b-2 border-[#3172AE] text-gray-900"
                  : "text-gray-400"
              }`}
            >
              Reallocate Budget
            </button>
          </div>

          {activePanel === "reimbursements" && (
            <PendingClubReimbursements clubId={club.id} disableCollapse={true} />
          )}

          {activePanel === "reallocate" && (
            <div className="w-96 ml-6">
              <div className="border border-gray-200 rounded-lg bg-white p-7 shadow-sm">
                <ReallocateBudget
                  clubId={club.id}
                  onReallocated={() => setBudgetKey((k) => k + 1)}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
