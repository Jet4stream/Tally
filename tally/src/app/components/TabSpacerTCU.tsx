"use client";
import { useState } from "react";
import DashboardContent from "./DashboardContent";
import ClubBudgetList from "./ClubBudgetList";
import TCUBudgetDetailView from "./TCUBudgetDetailView";

export default function TCUTabSpacer() {
  const [activeTab, setActiveTab] = useState("reimbursements");
  const [selectedClub, setSelectedClub] = useState<any>(null);

  return (
    <div>
      <div className="w-full h-[40px] sm:h-[50px] lg:h-[60px] bg-[#3172AE] flex items-center px-4 sm:px-6 lg:px-[32px]">
        <div className="flex items-end h-full">
          <button
            onClick={() => { setActiveTab("reimbursements"); setSelectedClub(null); }}
            className={`px-8 sm:px-12 lg:px-16 py-2 sm:py-3 rounded-t-xl font-[family-name:var(--font-public-sans)] font-medium text-sm sm:text-base lg:text-lg cursor-pointer transition-all ${
              activeTab === "reimbursements" ? "bg-white text-black" : "bg-[#EAEAEA] text-[#8D8B8B]"
            }`}
          >
            Reimbursements
          </button>

          <button
            onClick={() => setActiveTab("budgets")}
            className={`px-8 sm:px-12 lg:px-16 py-2 sm:py-3 rounded-t-xl font-[family-name:var(--font-public-sans)] font-medium text-sm sm:text-base lg:text-lg cursor-pointer transition-all ${
              activeTab === "budgets" ? "bg-white text-black" : "bg-[#EAEAEA] text-[#8D8B8B]"
            }`}
          >
            Club Budgets
          </button>
        </div>
      </div>

      {activeTab === "reimbursements" && <DashboardContent />}

      {activeTab === "budgets" && (
        <div className="bg-white min-h-[calc(100vh-160px)]">
          {!selectedClub ? (
            <ClubBudgetList onSelect={(club) => setSelectedClub(club)} />
          ) : (
            <TCUBudgetDetailView 
                club={selectedClub} 
                onBack={() => setSelectedClub(null)} 
            />
          )}
        </div>
      )}
    </div>
  );
}