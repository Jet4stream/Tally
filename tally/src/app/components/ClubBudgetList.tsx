"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getAllClubs } from "@/lib/api/club";
import { Club } from "@prisma/client";

export default function ClubBudgetList() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const data = await getAllClubs();
        setClubs(data);
      } catch (error) {
        console.error("Error fetching clubs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-gray-400">Loading budgets...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-[32px] py-10 font-[family-name:var(--font-pt-sans)]">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search for a club budget..."
          className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-[#F9F9F9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3172AE]/30 transition-all text-lg text-gray-400 shadow-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4">
        {filteredClubs.map((club) => (
          <button
            key={club.id}
            className="flex items-center p-6 bg-white border border-gray-100 rounded-[1.5rem] hover:border-[#3172AE] hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image src="/file.svg" alt="File" fill className="object-contain" />
              </div>
              
              <div className="text-left">
                <span className="block font-extrabold text-[#1a1a1a] text-xl leading-tight">
                  {club.name}
                </span>
                <span className="text-[12px] text-[#A3A3A3] uppercase tracking-[0.15em] font-bold mt-1">
                  View Allocation & Expenses
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}