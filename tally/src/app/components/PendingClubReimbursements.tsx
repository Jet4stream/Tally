"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

import paperclipIcon from "../assests/paperclip.svg";

import { getReimbursementsByClubId } from "@/lib/api/reimbursement";
import { getUserById } from "@/lib/api/user";
import { updateReimbursement } from "@/lib/api/reimbursement";
import { getBudgetItemById, updateBudgetItem } from "@/lib/api/budgetItem";

import { ReimbursementStatus } from "@prisma/client";

export default function PendingClubReimbursements({ clubId }: { clubId: string }) {
  const { user, isLoaded } = useUser();

  const [pending, setPending] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeReimbursement, setActiveReimbursement] = useState<any | null>(null);

  const [isTCU, setIsTCU] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [approving, setApproving] = useState(false);

  // ✅ Load reimbursements via helper + filter SUBMITTED
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const all = await getReimbursementsByClubId(clubId);
        const submitted = (all ?? []).filter(
          (r) => r.status === ReimbursementStatus.SUBMITTED
        );
        if (!cancelled) setPending(submitted);
      } catch (e) {
        console.error("Failed to load reimbursements:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

  // ✅ Check if user is TCU
  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      try {
        if (!user?.id) {
          if (!cancelled) setIsTCU(false);
          return;
        }

        const dbUser = await getUserById(user.id);
        if (!cancelled) setIsTCU(dbUser?.role === "TCU_TREASURER");
      } catch {
        if (!cancelled) setIsTCU(false);
      } finally {
        if (!cancelled) setLoadingRole(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  // ✅ Open PDF (same pattern as DataTable)
  const handleOpenPdf = async (r: any) => {
    if (!r.generatedFormPdfUrl) return;

    try {
      const res = await fetch(
        `/api/reimbursements/signed-url?url=${encodeURIComponent(r.generatedFormPdfUrl)}`
      );
      const json = await res.json();
      if (json.signedUrl) {
        setPdfUrl(json.signedUrl);
        setActiveReimbursement(r);
      }
    } catch (e) {
      console.error("Failed to load PDF", e);
    }
  };

  const closeModal = () => {
    setPdfUrl(null);
    setActiveReimbursement(null);
  };

  // ✅ Approve using existing update functions
  const onApprove = async () => {
    if (!activeReimbursement || !isTCU) return;

    const { id, budgetItemId, amountCents } = activeReimbursement;

    if (!budgetItemId) {
      alert("No budget item selected.");
      return;
    }

    setApproving(true);
    try {
      const item = await getBudgetItemById(budgetItemId);
      const newSpent = (item.spentCents ?? 0) + amountCents;

      await updateBudgetItem(budgetItemId, { spentCents: newSpent });

      await updateReimbursement(id, {
        status: ReimbursementStatus.APPROVED,
        reviewedAt: new Date(),
      });

      closeModal();

      // refresh list
      const all = await getReimbursementsByClubId(clubId);
      const submitted = (all ?? []).filter(
        (r) => r.status === ReimbursementStatus.SUBMITTED
      );
      setPending(submitted);
    } catch (e) {
      console.error("Approve failed:", e);
      alert("Approve failed.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className={`transition-all duration-300 shrink-0 ${isOpen ? "w-96 ml-6" : "w-auto ml-4"}`}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-3 bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-24 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="text-gray-400 text-sm font-medium">«</span>
          <span className="text-gray-500 text-[11px] font-medium tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">
            Pending Reimbursements
          </span>
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white p-7 shadow-sm">
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl font-medium mb-4 block"
          >
            »
          </button>

          <h2 className="font-semibold text-[28px] text-gray-900 mb-2">
            Pending Reimbursements
          </h2>

          <p className="text-gray-500 text-xs mb-6">
            Click on a reimbursement to see more information and respond.
          </p>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {pending.length > 0 ? (
              pending.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg text-sm hover:bg-gray-50"
                >
                  <span className="text-gray-400 text-[11px]">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>

                  <span className="font-medium text-gray-700 truncate px-2">
                    {r.description}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      ${(r.amountCents / 100).toFixed(2)}
                    </span>

                    <Image
                      src={paperclipIcon}
                      alt="Attachment"
                      width={18}
                      height={18}
                      className="cursor-pointer"
                      onClick={() => handleOpenPdf(r)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm italic">
                No pending requests
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Modal (same as DataTable logic) */}
      {pdfUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl w-[95%] max-w-[1100px] h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <span className="font-semibold text-lg">Reimbursement Form</span>
              <button onClick={closeModal}>✕</button>
            </div>

            <div className="flex flex-1">
              <iframe src={pdfUrl} className="flex-1 w-full" />

              {!loadingRole && isTCU && (
                <div className="w-[260px] border-l p-4 flex flex-col gap-3">
                  <button
                    onClick={onApprove}
                    disabled={approving}
                    className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold"
                  >
                    {approving ? "Approving..." : "Approve"}
                  </button>

                  <button
                    onClick={() =>
                      console.log("REJECT clicked", activeReimbursement?.id)
                    }
                    className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}