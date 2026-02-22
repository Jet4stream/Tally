"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

import trashIcon from "../assests/trash.svg";
import paperclipIcon from "../assests/paperclip.svg";

import { deleteReimbursement, updateReimbursement } from "@/lib/api/reimbursement";
import { getBudgetItemById, updateBudgetItem } from "@/lib/api/budgetItem";
import { getUserById } from "@/lib/api/user";

type ReimbursementRow = {
  id: string;
  date: string;
  payTo: string;
  owed: string;
  item: string;
  event: string;

  status: string; // "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED" | ...
  statusColor: string;

  generatedFormPdfUrl: string | null;

  amountCents: number;
  budgetItemId: string | null;

  rejectionReason?: string | null;
};

export default function DataTable({
  data,
  showDelete = true,
}: {
  data: ReimbursementRow[];
  showDelete?: boolean;
}) {
  const { user, isLoaded } = useUser();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeReimbursement, setActiveReimbursement] = useState<ReimbursementRow | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [isTCU, setIsTCU] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  const [acting, setActing] = useState<"APPROVE" | "PAID" | "REJECT" | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectErr, setRejectErr] = useState("");

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

  const handleOpenPdf = async (r: ReimbursementRow) => {
    if (!r.generatedFormPdfUrl) return;

    // reset reject state each time you open a new PDF
    setRejectOpen(false);
    setRejectReason("");
    setRejectErr("");

    setLoadingPdf(true);
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
    } finally {
      setLoadingPdf(false);
    }
  };

  const closeModal = () => {
    setPdfUrl(null);
    setActiveReimbursement(null);

    setRejectOpen(false);
    setRejectReason("");
    setRejectErr("");
  };

  const onApprove = async () => {
    if (!activeReimbursement || !isTCU) return;
    if (activeReimbursement.status !== "SUBMITTED") return;

    setActing("APPROVE");
    try {
      await updateReimbursement(activeReimbursement.id, {
        status: "APPROVED",
        reviewedAt: new Date(),
      });

      setActiveReimbursement((prev) => (prev ? { ...prev, status: "APPROVED" } : prev));
    } catch (e) {
      console.error("Approve failed:", e);
      alert("Approve failed.");
    } finally {
      setActing(null);
    }
  };

  const onPaid = async () => {
    if (!activeReimbursement || !isTCU) return;
    if (activeReimbursement.status !== "APPROVED") return;

    const { id: reimbursementId, budgetItemId, amountCents } = activeReimbursement;

    if (!budgetItemId) {
      alert("This reimbursement has no budget item selected.");
      return;
    }

    setActing("PAID");
    try {
      const item = await getBudgetItemById(budgetItemId);
      const newSpent = (item.spentCents ?? 0) + amountCents;
      await updateBudgetItem(budgetItemId, { spentCents: newSpent });

      await updateReimbursement(reimbursementId, {
        status: "PAID",
        paidAt: new Date(),
      });

      setActiveReimbursement((prev) => (prev ? { ...prev, status: "PAID" } : prev));

      closeModal();
      window.location.reload();
    } catch (e) {
      console.error("Paid failed:", e);
      alert("Paid failed. (Budget + reimbursement may be out of sync if one update succeeded.)");
    } finally {
      setActing(null);
    }
  };

  const onRejectClick = () => {
    if (!activeReimbursement || !isTCU) return;

    setRejectErr("");
    setRejectOpen(true);
  };

  const onSubmitReject = async () => {
    if (!activeReimbursement || !isTCU) return;

    const reason = rejectReason.trim();
    if (reason.length === 0) {
      setRejectErr("Please enter a rejection reason.");
      return;
    }

    setActing("REJECT");
    try {
      await updateReimbursement(activeReimbursement.id, {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedAt: new Date(),
      });

      // update modal state so UI matches
      setActiveReimbursement((prev) =>
        prev ? { ...prev, status: "REJECTED", rejectionReason: reason } : prev
      );

      closeModal();
      window.location.reload();
    } catch (e) {
      console.error("Reject failed:", e);
      alert("Reject failed.");
    } finally {
      setActing(null);
    }
  };

  const actionKind: "APPROVE" | "PAID" | null =
    activeReimbursement?.status === "SUBMITTED"
      ? "APPROVE"
      : activeReimbursement?.status === "APPROVED"
      ? "PAID"
      : null;

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
            className="flex items-center border border-[#8D8B8B] rounded-lg px-3 py-4 text-sm font-[family-name:var(--font-pt-sans)] "
          >
            <span className="w-[12%]">{r.date}</span>
            <span className="w-[14%]">{r.payTo}</span>
            <span className="w-[10%]">{r.owed}</span>
            <span className="w-[22%]">{r.item}</span>
            <span className="w-[18%]">{r.event}</span>

            <span className={`w-[18%] ${r.statusColor} flex items-center gap-2`}>
              <span>{r.status}</span>

              {r.status === "REJECTED" && (r.rejectionReason ?? "").trim() !== "" && (
                <span className="relative group inline-flex items-center">
                  {/* icon (paperclip for now) */}
                  <Image src={paperclipIcon} alt="Rejection reason" width={16} height={16} />

                  {/* tooltip */}
                  <span
                    className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2
                               w-56 rounded-lg bg-black text-white text-[11px] leading-snug
                               px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {r.rejectionReason}
                  </span>
                </span>
              )}
            </span>

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
                onClick={() => handleOpenPdf(r)}
                disabled={!r.generatedFormPdfUrl || loadingPdf}
                
              >
                <Image src={paperclipIcon} alt="Attachment" width={18} height={18} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* PDF Modal */}
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
                    <div className="text-xs text-gray-500">Status: {activeReimbursement?.status ?? "—"}</div>
                  </div>

                  {actionKind === "APPROVE" && (
                    <button
                      type="button"
                      onClick={onApprove}
                      disabled={acting !== null}
                      className="w-full rounded-xl py-3 font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {acting === "APPROVE" ? "Approving..." : "Approve"}
                    </button>
                  )}

                  {actionKind === "PAID" && (
                    <button
                      type="button"
                      onClick={onPaid}
                      disabled={acting !== null}
                      className="w-full rounded-xl py-3 font-semibold text-white bg-[#3172AE] hover:bg-[#2860a0] disabled:opacity-50"
                    >
                      {acting === "PAID" ? "Marking Paid..." : "Paid"}
                    </button>
                  )}

                  {actionKind === null && (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl py-3 font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
                    >
                      {activeReimbursement?.status ?? "—"}
                    </button>
                  )}

                  {!rejectOpen ? (
                    <button
                      type="button"
                      onClick={onRejectClick}
                      disabled={acting !== null}
                      className="w-full rounded-xl py-3 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  ) : (
                    <div className="mt-1 flex flex-col gap-2">
                      <label className="text-xs text-gray-500 font-[family-name:var(--font-pt-sans)]">
                        Rejection reason
                      </label>

                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3172AE]"
                        placeholder="Explain why this reimbursement was rejected..."
                      />

                      {rejectErr && <div className="text-xs text-red-600">{rejectErr}</div>}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectOpen(false);
                            setRejectReason("");
                            setRejectErr("");
                          }}
                          disabled={acting !== null}
                          className="flex-1 rounded-xl py-2.5 font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={onSubmitReject}
                          disabled={acting !== null || rejectReason.trim().length === 0}
                          className="flex-1 rounded-xl py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {acting === "REJECT" ? "Submitting..." : "Submit response"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}