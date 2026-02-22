"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

import trashIcon from "../assests/trash.svg";
import paperclipIcon from "../assests/paperclip.svg";
import receiptIcon from "../assests/receipt.svg";

import { deleteReimbursement, updateReimbursement } from "@/lib/api/reimbursement";
import { getBudgetItemById, updateBudgetItem } from "@/lib/api/budgetItem";
import { getUserById } from "@/lib/api/user";
import { ReimbursementStatus } from "@prisma/client";
import { usePdfModal } from "@/hooks/usePdfModal";
import { useReceiptModal } from "@/hooks/useReceiptModal";

type ReimbursementRow = {
  id: string;
  date: string;
  payTo: string;
  owed: string;
  item: string;
  event: string;
  status: string;
  statusColor: string;
  generatedFormPdfUrl: string | null;
  receiptUrl: string | null;
  amountCents: number;
  budgetItemId: string | null;
};

export default function DataTable({
  data,
  showDelete = true,
}: {
  data: ReimbursementRow[];
  showDelete?: boolean;
}) {
  const { user, isLoaded } = useUser();
  const { pdfUrl, activeReimbursement, loadingPdf, handleOpenPdf, closeModal } = usePdfModal();
  const { handleOpenReceipt } = useReceiptModal();

  const [isTCU, setIsTCU] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingRole(true);
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


  const onApprove = async () => {
    if (!activeReimbursement) return;
    if (!isTCU) return;

    const { id: reimbursementId, budgetItemId, amountCents } = activeReimbursement;

    if (!budgetItemId) {
      alert("This reimbursement has no budget item selected.");
      return;
    }

    setApproving(true);
    try {
      const item = await getBudgetItemById(budgetItemId);
      const newSpent = (item.spentCents ?? 0) + amountCents;
      await updateBudgetItem(budgetItemId, { spentCents: newSpent });

      await updateReimbursement(reimbursementId, {
        status: ReimbursementStatus.APPROVED,
        reviewedAt: new Date(),
      });

      closeModal();
      window.location.reload();
    } catch (e) {
      console.error("Approve failed:", e);
      alert("Approve failed. (Budget + reimbursement may be out of sync if one update succeeded.)");
    } finally {
      setApproving(false);
    }
  };

  const onReject = async () => {
    if (!activeReimbursement) return;
    if (!isTCU) return;
    console.log("REJECT clicked", { reimbursementId: activeReimbursement.id });
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
        {data.map((r) => (
          <div
            key={r.id}
            className="flex items-center border border-[#8D8B8B] rounded-lg px-3 py-4 text-sm font-[family-name:var(--font-pt-sans)]"
          >
            <span className="w-[12%]">{r.date}</span>
            <span className="w-[14%]">{r.payTo}</span>
            <span className="w-[10%]">{r.owed}</span>
            <span className="w-[22%]">{r.item}</span>
            <span className="w-[18%]">{r.event}</span>
            <span className={`w-[18%] ${r.statusColor}`}>{r.status}</span>
            <span className="w-[6%] flex gap-4 justify-end">
              {showDelete && (
                <button
                  className="cursor-pointer"
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this reimbursement?")) return;
                    await deleteReimbursement(r.id);
                    window.location.reload();
                  }}
                >
                  <Image src={trashIcon} alt="Delete" width={18} height={18} />
                </button>
              )}

             <button
                className="cursor-pointer disabled:opacity-30"
                onClick={() => handleOpenReceipt(r.receiptUrl)}
                disabled={!r.receiptUrl}
                >
                <Image src={receiptIcon} alt="Receipt" width={18} height={18} />
                </button>

              <button
                className="cursor-pointer disabled:opacity-30"
                onClick={() => r.generatedFormPdfUrl && handleOpenPdf(r.generatedFormPdfUrl, r)}
                disabled={!r.generatedFormPdfUrl || loadingPdf}
              >
                <Image src={paperclipIcon} alt="Attachment" width={18} height={18} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {pdfUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div
            className="bg-white rounded-xl w-[95%] max-w-[1100px] h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
              <span className="font-semibold text-lg">Reimbursement Form</span>
              <button onClick={closeModal} className="text-xl font-bold text-black hover:text-gray-500">
                ✕
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              <div className="flex-1 min-w-0">
                <iframe src={pdfUrl} className="h-full w-full" title="Reimbursement PDF" />
              </div>

              {!loadingRole && isTCU && (
                <div className="w-[260px] border-l border-[#EAEAEA] p-4 flex flex-col gap-3 bg-white">
                  <div className="text-sm text-gray-700">
                    <div className="font-semibold text-gray-900 mb-1">Actions</div>
                    <div className="text-xs text-gray-500">
                      {activeReimbursement ? `Reimbursement: ${activeReimbursement.id}` : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={approving}
                    className="w-full rounded-xl py-3 font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {approving ? "Approving..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={onReject}
                    className="w-full rounded-xl py-3 font-semibold text-white bg-red-600 hover:bg-red-700"
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