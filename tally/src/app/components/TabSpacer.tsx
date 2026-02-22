"use client";
import { useState } from "react";
import DashboardContent from "./DashboardContent";
import ReimbursementTable from "./ReimbursementTable";
import BudgetSheet from "./TreasurerBudgetSheet";

export default function TabSpacer() {
  const [activeTab, setActiveTab] = useState("reimbursements");

  return (
    <div>
      <div className="w-full h-[40px] sm:h-[50px] lg:h-[60px] bg-[#3172AE] flex items-end px-4 sm:px-6 lg:px-[32px]">
        <div className="flex">
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