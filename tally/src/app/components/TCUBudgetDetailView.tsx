"use client";
import Image from "next/image";
import BudgetSheet from "./TreasurerBudgetSheet";
import PendingClubReimbursements from "./PendingClubReimbursements";
import pencilIcon from "../assests/pencil.svg";

export default function TCUBudgetDetailView({ club, onBack }: { club: any, onBack: () => void }) {
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
              Dept ID: {club.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          {/* <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
             <Image src={pencilIcon} alt="Edit" width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button> */}
        </div>
      </div>

      <div className="flex flex-col items-end lg:flex-row lg:items-start gap-0">
        
        {/* Left: Main Budget Content */}
        <div className="flex-1 w-full min-w-0">
           <BudgetSheet forcedClubId={club.id} hideReallocate={true} />
        </div>
        
        {/* Right: Side Menu */}
        <PendingClubReimbursements clubId={club.id} />
        
      </div>
    </div>
  );
}