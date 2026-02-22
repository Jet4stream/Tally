"use client";

import { useState } from "react";
import Image from "next/image";
import trashIcon from "../assests/trash.svg";
import paperclipIcon from "../assests/paperclip.svg";
import { deleteReimbursement } from "@/lib/api/reimbursement";


type Reimbursement = {
  id: string;
  date: string;
  payTo: string;
  owed: string;
  item: string;
  event: string;
  status: string;
  statusColor: string;
  generatedFormPdfUrl: string | null;
};

export default function DataTable({ data, showDelete = true }: { data: Reimbursement[]; showDelete?: boolean }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenPdf = async (supabaseUrl: string | null) => {
    if (!supabaseUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reimbursements/signed-url?url=${encodeURIComponent(supabaseUrl)}`);
      const data = await res.json();
      if (data.signedUrl) {
        setPdfUrl(data.signedUrl);
      }
    } catch (e) {
      console.error("Failed to load PDF", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex text-sm text-black bg-[#F5F5F5] px-3 py-2 mb-2 rounded font-[family-name:var(--font-public-sans)]">
        <span className="w-[12%]">Requested</span>
        <span className="w-[14%]">Pay to</span>
        <span className="w-[10%]">Owed</span>
        <span className="w-[22%]">Item</span>
        <span className="w-[18%]">Event</span>
        <span className="w-[18%]">Status</span>
        <span className="w-[6%]"></span>
      </div>

      <div className="flex flex-col gap-2">
        {data.map((r, i) => (
          <div key={r.id} className="flex items-center border border-[#8D8B8B] rounded-lg px-3 py-4 text-sm font-[family-name:var(--font-pt-sans)]">
            <span className="w-[12%]">{r.date}</span>
            <span className="w-[14%]">{r.payTo}</span>
            <span className="w-[10%]">{r.owed}</span>
            <span className="w-[22%]">{r.item}</span>
            <span className="w-[18%]">{r.event}</span>
            <span className={`w-[18%] ${r.statusColor}`}>{r.status}</span>
            <span className="w-[6%] flex gap-4 justify-end">
              {showDelete && (
                <button
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this reimbursement?")) return;

                    try {
                      await deleteReimbursement(r.id);
                      window.location.reload(); // quick refresh (can improve later)
                    } catch (e) {
                      alert("Failed to delete reimbursement");
                    }
                  }}
                >
                  <Image src={trashIcon} alt="Delete" width={18} height={18} className="cursor-pointer"/>
                </button>
              )}
              <button
                onClick={() => handleOpenPdf(r.generatedFormPdfUrl)}
                disabled={!r.generatedFormPdfUrl || loading}
                className="disabled:opacity-30"
              >
                <Image src={paperclipIcon} alt="Attachment" width={18} height={18} className="cursor-pointer" />
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* PDF Modal */}
      {pdfUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPdfUrl(null)}
        >
          <div
            className="bg-white rounded-xl w-[90%] max-w-[800px] h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
              <span className="font-[family-name:var(--font-public-sans)] font-semibold text-lg">
                Reimbursement Form
              </span>
              <button
                onClick={() => setPdfUrl(null)}
                className="text-xl font-bold text-black hover:text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <iframe
              src={pdfUrl}
              className="flex-1 w-full"
              title="Reimbursement PDF"
            />
          </div>
        </div>
      )}
    </div>
  );
}