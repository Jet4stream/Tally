"use client";
import { useState, useEffect, useMemo } from "react";
import DataTable from "./DataTable";
import { useUser } from "@clerk/nextjs";
import { getReimbursementsByPayeeUserId } from "@/lib/api/reimbursement";
import type { ReimbursementWithPayee } from "@/types/reimbursement";

export default function MemberDashboard() {
  const [subTab, setSubTab] = useState<string>("unpaid");
  const [reimbursements, setReimbursements] = useState<ReimbursementWithPayee[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const { unpaidRows, paidRows } = useMemo(() => {
    const mapped = reimbursements.map((r) => ({
      date: new Date(r.submittedAt).toLocaleDateString("en-US"),
      payTo: `${r.payee?.firstName ?? ""} ${r.payee?.lastName ?? ""}`.trim(),
      owed: `$${(r.amountCents / 100).toFixed(2)}`,
      item: r.description ?? "",
      event: r.clubName ?? "",
      status: r.status,
      statusColor:
        r.status === "REJECTED"
          ? "text-red-500"
          : r.status === "APPROVED"
          ? "text-green-600"
          : "text-gray-600",
    }));

    return {
      unpaidRows: mapped.filter((r) => r.status !== "PAID"),
      paidRows: mapped.filter((r) => r.status === "PAID"),
    };
  }, [reimbursements]);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getReimbursementsByPayeeUserId(userId);
        if (!cancelled) setReimbursements(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to fetch reimbursements");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, userId]);

  return (
    <div className="px-4 sm:px-6 lg:px-[32px] pt-[16px]">
      <div className="flex mb-4 border-b border-gray-200">
        <button
          onClick={() => setSubTab("unpaid")}
          className={`w-[80px] sm:w-[100px] lg:w-[120px] text-center text-sm sm:text-base lg:text-lg font-[family-name:var(--font-public-sans)] font-medium py-2 sm:py-3 ${
            subTab === "unpaid" ? "border-b-2 border-[#3172AE] text-black" : "text-[#8D8B8B]"
          }`}
        >
          Unpaid
        </button>
        <button
          onClick={() => setSubTab("paid")}
          className={`w-[80px] sm:w-[100px] lg:w-[120px] text-center text-sm sm:text-base lg:text-lg font-[family-name:var(--font-public-sans)] font-medium py-2 sm:py-3 ${
            subTab === "paid" ? "border-b-2 border-[#3172AE] text-black" : "text-[#8D8B8B]"
          }`}
        >
          Paid
        </button>
      </div>

      <div className="h-[calc(100vh-220px)] sm:h-[calc(100vh-240px)] lg:h-[calc(100vh-260px)] overflow-y-auto">
        {loading && <p className="text-gray-400 text-sm">Loading...</p>}
        {err && <p className="text-red-500 text-sm">{err}</p>}
        {subTab === "unpaid" && <DataTable data={unpaidRows} showDelete={false} />}
        {subTab === "paid" && <DataTable data={paidRows} showDelete={false} />}
      </div>
    </div>
  );
}