"use client";
import { useState } from "react";
import Link from "next/link";
import DashboardContent from "./TCUDashboard";
import BudgetSheet from "./TreasurerBudgetSheet";


export default function TabSpacer() {
  const [activeTab, setActiveTab] = useState("reimbursements");

  return (
    <div>
      <div className="w-full h-[40px] sm:h-[50px] lg:h-[60px] bg-[#3172AE] flex items-center px-4 sm:px-6 lg:px-[32px]">
        <div className="flex items-end h-full">
          <button
            onClick={() => setActiveTab("reimbursements")}
            className={`px-8 sm:px-12 lg:px-16 py-2 sm:py-3 rounded-t-xl font-[family-name:var(--font-public-sans)] font-medium text-sm sm:text-base lg:text-lg cursor-pointer ${
              activeTab === "reimbursements"
                ? "bg-white text-black"
                : "bg-[#EAEAEA] text-[#8D8B8B]"
            }`}
          >
            Reimbursements
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`px-8 sm:px-12 lg:px-16 py-2 sm:py-3 rounded-t-xl font-[family-name:var(--font-public-sans)] font-medium text-sm sm:text-base lg:text-lg cursor-pointer ${
              activeTab === "budget"
                ? "bg-white text-black"
                : "bg-[#EAEAEA] text-[#8D8B8B]"
            }`}
          >
            Budget Sheet
          </button>
        </div>
        <Link
          href="/pages/members"
          className="ml-auto text-white! underline! underline-offset-4! font-[family-name:var(--font-public-sans)] font-bold text-sm! sm:text-base flex items-center gap-2 hover:opacity-80 transition-opacity underline underline-offset-4 decoration-1"
        >
          See your reimbursements →
        </Link>
      </div>

      {activeTab === "reimbursements" && <DashboardContent />}

      {activeTab === "budget" && (
        <div className="h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)] overflow-y-auto">
          <BudgetSheet />
        </div>
      )}
    </div>
  );
}