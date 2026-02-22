"use client";
import { useEffect, useState } from "react";

export default function PendingClubReimbursements({ clubId }: { clubId: string }) {
  const [pending, setPending] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/reimbursements?clubId=${clubId}&status=PENDING`)
      .then(res => res.json())
      .then(data => setPending(data.data || []));
  }, [clubId]);

  return (
    <div className={`transition-all duration-300 shrink-0 ${isOpen ? "w-96 ml-6" : "w-auto ml-4"}`}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-3 bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-24 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="text-gray-400 text-sm font-medium">«</span>
          <span className="text-gray-500 text-[11px] font-medium tracking-widest uppercase [writing-mode:vertical-rl] rotate-180 font-[family-name:var(--font-pt-sans)]">
            Pending Reimbursements
          </span>
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white p-7 shadow-sm">
          <div className="mb-3">
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-gray-400 hover:text-gray-600 text-2xl font-medium mb-4 block"
            >
              »
            </button>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold font-[family-name:var(--font-public-sans)] text-[28px] leading-none tracking-normal text-gray-900">
                Pending Reimbursements
              </h2>
            </div>
          </div>

          <p className="text-gray-500 text-xs mb-6 font-[family-name:var(--font-pt-sans)]">
            Click on a reimbursement to see more information and respond to the request.
          </p>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {pending.length > 0 ? (
              pending.map((r) => (
                <div 
                  key={r.id} 
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg text-sm group cursor-pointer hover:bg-gray-50 transition-all"
                >
                  <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-gray-700 truncate px-2 font-[family-name:var(--font-pt-sans)]">
                    {r.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 font-[family-name:var(--font-pt-sans)]">
                      ${(r.amountCents / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-300 group-hover:text-[#3172AE] transition-colors">📎</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm italic font-[family-name:var(--font-pt-sans)]">
                No pending requests
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}