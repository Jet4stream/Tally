"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

import paperclipIcon from "../assests/paperclip.svg";

import { getReimbursementsByClubId, updateReimbursement } from "@/lib/api/reimbursement";
import { getUserById } from "@/lib/api/user";
import { getBudgetItemById, updateBudgetItem } from "@/lib/api/budgetItem";

import { ReimbursementStatus } from "@prisma/client";

export default function PendingClubReimbursements({ clubId }: { clubId: string }) {
  const { user, isLoaded } = useUser();

  // show both SUBMITTED + APPROVED (because Approved becomes Paid)
  const [pending, setPending] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeReimbursement, setActiveReimbursement] = useState<any | null>(null);

  const [isTCU, setIsTCU] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  const [acting, setActing] = useState<"APPROVE" | "PAID" | "REJECT" | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectErr, setRejectErr] = useState("");

  const refreshList = async () => {
    const all = await getReimbursementsByClubId(clubId);
    const visible = (all ?? []).filter(
      (r) =>
        r.status === ReimbursementStatus.SUBMITTED ||
        r.status === ReimbursementStatus.APPROVED
    );
    setPending(visible);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const all = await getReimbursementsByClubId(clubId);
        const visible = (all ?? []).filter(
          (r) =>
            r.status === ReimbursementStatus.SUBMITTED ||
            r.status === ReimbursementStatus.APPROVED
        );
        if (!cancelled) setPending(visible);
      } catch (e) {
        console.error("Failed to load reimbursements:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

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

  const handleOpenPdf = async (r: any) => {
    if (!r.generatedFormPdfUrl) return;

    // reset reject UI each open
    setRejectOpen(false);
    setRejectReason("");
    setRejectErr("");

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

    setRejectOpen(false);
    setRejectReason("");
    setRejectErr("");
  };

  const onApprove = async () => {
    if (!activeReimbursement || !isTCU) return;
    if (activeReimbursement.status !== ReimbursementStatus.SUBMITTED) return;

    setActing("APPROVE");
    try {
      await updateReimbursement(activeReimbursement.id, {
        status: ReimbursementStatus.APPROVED,
        reviewedAt: new Date(),
      });

      // update local state so button flips immediately to Paid
      setActiveReimbursement((prev: any) =>
        prev ? { ...prev, status: ReimbursementStatus.APPROVED, reviewedAt: new Date() } : prev
      );

      await refreshList();
    } catch (e) {
      console.error("Approve failed:", e);
      alert("Approve failed.");
    } finally {
      setActing(null);
    }
  };

  const onPaid = async () => {
    if (!activeReimbursement || !isTCU) return;
    if (activeReimbursement.status !== ReimbursementStatus.APPROVED) return;

    const { id, budgetItemId, amountCents } = activeReimbursement;

    if (!budgetItemId) {
      alert("No budget item selected.");
      return;
    }

    setActing("PAID");
    try {
      const item = await getBudgetItemById(budgetItemId);
      const newSpent = (item.spentCents ?? 0) + amountCents;

      await updateBudgetItem(budgetItemId, { spentCents: newSpent });

      await updateReimbursement(id, {
        status: ReimbursementStatus.PAID,
        paidAt: new Date(),
      });

      closeModal();

      // After paid, remove from list (we only show SUBMITTED/APPROVED)
      await refreshList();
    } catch (e) {
      console.error("Paid failed:", e);
      alert("Paid failed.");
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
        status: ReimbursementStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
      });

      closeModal();
      await refreshList();
    } catch (e) {
      console.error("Reject failed:", e);
      alert("Reject failed.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div
      className={`transition-all duration-300 shrink-0 ${
        isOpen ? "w-96 ml-6" : "w-auto ml-4"
      }`}
    >
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

      {/* PDF Modal */}
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

            <div className="flex flex-1 min-h-0">
              <iframe src={pdfUrl} className="flex-1 w-full" />

              {!loadingRole && isTCU && (
                <div className="w-[260px] border-l p-4 flex flex-col gap-3 bg-white">
                  {/* If SUBMITTED -> show Approve */}
                  {activeReimbursement?.status === ReimbursementStatus.SUBMITTED && (
                    <button
                      onClick={onApprove}
                      disabled={acting !== null}
                      className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-60"
                    >
                      {acting === "APPROVE" ? "Approving..." : "Approve"}
                    </button>
                  )}

                  {/* If APPROVED -> show Paid */}
                  {activeReimbursement?.status === ReimbursementStatus.APPROVED && (
                    <button
                      onClick={onPaid}
                      disabled={acting !== null}
                      className="w-full py-3 rounded-xl bg-[#3172AE] text-white font-semibold disabled:opacity-60"
                    >
                      {acting === "PAID" ? "Marking Paid..." : "Paid"}
                    </button>
                  )}

                  {/* If neither, show disabled status */}
                  {activeReimbursement?.status !== ReimbursementStatus.SUBMITTED &&
                    activeReimbursement?.status !== ReimbursementStatus.APPROVED && (
                      <button
                        disabled
                        className="w-full py-3 rounded-xl bg-gray-200 text-gray-600 font-semibold cursor-not-allowed"
                      >
                        {String(activeReimbursement?.status ?? "—")}
                      </button>
                    )}

                  {!rejectOpen ? (
                    <button
                      onClick={onRejectClick}
                      disabled={acting !== null}
                      className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60"
                    >
                      Reject
                    </button>
                  ) : (
                    <div className="mt-1 flex flex-col gap-2">
                      <label className="text-xs text-gray-500">Rejection reason</label>

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
                          className="flex-1 rounded-xl py-2.5 font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={onSubmitReject}
                          disabled={acting !== null || rejectReason.trim().length === 0}
                          className="flex-1 rounded-xl py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
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