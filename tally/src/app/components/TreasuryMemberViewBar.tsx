"use client";
import Link from "next/link";

export default function TreasuryMemberViewBar() {
    
  return (
    <div className="text-white underline underline-offset-4 decoration-1 w-full h-[40px] sm:h-[50px] lg:h-[60px] bg-[#3172AE] flex items-center px-4 sm:px-6 lg:px-[32px]">
      <Link
        href="/"
        className="font-[family-name:var(--font-public-sans)] font-bold text-sm sm:text-base flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        ← Back to treasury view
      </Link>
    </div>
  );
}