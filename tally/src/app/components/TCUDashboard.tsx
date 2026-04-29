"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable from "./DataTable";
import { useUser } from "@clerk/nextjs";
import { getReimbursementsByClubId, getAllReimbursements } from "@/lib/api/reimbursement";
import type { ReimbursementWithPayee } from "@/types/reimbursement";
import ClubMembers from "./ClubMembers";
import { useTreasurerStore } from "@/store/treasurerStore";

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Submitted", active: "bg-gray-100 border-gray-500 text-gray-800", inactive: "border-gray-200 text-gray-400" },
  { value: "APPROVED",  label: "Approved",  active: "bg-green-50 border-green-500 text-green-700", inactive: "border-gray-200 text-gray-400" },
  { value: "REJECTED",  label: "Rejected",  active: "bg-red-50 border-red-500 text-red-600",   inactive: "border-gray-200 text-gray-400" },
] as const;

export default function DashboardContent() {
  const [subTab, setSubTab] = useState<string>("unpaid");
  const [reimbursements, setReimbursements] = useState<ReimbursementWithPayee[]>([]);
  const [, setLoading] = useState(false);
  const [, setErr] = useState("");

  const [filterClub, setFilterClub] = useState<string>("");
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());

  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const treasurerClubId = useTreasurerStore((s) => s.treasurerClubId);
  const isTcuTreasury = useTreasurerStore((s) => s.isTCU);

  const toggleStatus = useCallback((status: string) => {
    setFilterStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const { unpaidRows, paidRows, allClubs } = useMemo(() => {
    const mapped = reimbursements.map((r) => {
      let eventName = "";
      let itemName = "";

      try {
        const parsed = JSON.parse(r.description ?? "");
        const parts = (parsed.eventBudgetLine ?? "").split(" — ");
        eventName = parts[0] ?? "";
        itemName = parts[1] ?? "";
      } catch {
        // not JSON
      }

      return {
        id: r.id,
        date: new Date(r.submittedAt).toLocaleDateString("en-US"),
        payTo: `${r.payee?.firstName ?? ""} ${r.payee?.lastName ?? ""}`.trim(),
        owed: `$${(r.amountCents / 100).toFixed(2)}`,
        item: itemName,
        event: eventName,
        status: r.status,
        generatedFormPdfUrl: r.generatedFormPdfUrl ?? null,
        amountCents: r.amountCents,
        budgetItemId: r.budgetItemId,
        statusColor:
          r.status === "REJECTED"
            ? "text-red-500"
            : r.status === "APPROVED"
            ? "text-green-600"
            : "text-gray-600",
        receiptUrl: r.receiptFileUrl ?? null,
        _clubName: r.clubName,
      };
    });

    const clubs = [...new Set(mapped.map((r) => r._clubName).filter(Boolean))].sort();

    return {
      unpaidRows: mapped.filter((r) => r.status !== "PAID"),
      paidRows: mapped.filter((r) => r.status === "PAID"),
      allClubs: clubs,
    };
  }, [reimbursements]);

  const filteredUnpaidRows = useMemo(() => {
    return unpaidRows
      .filter((r) => !filterClub || r._clubName === filterClub)
      .filter((r) => filterStatuses.size === 0 || filterStatuses.has(r.status));
  }, [unpaidRows, filterClub, filterStatuses]);

  const filteredPaidRows = useMemo(() => {
    return paidRows.filter((r) => !filterClub || r._clubName === filterClub);
  }, [paidRows, filterClub]);

  const fetchData = useCallback(() => {
    if (!isLoaded || !userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        let data: ReimbursementWithPayee[] = [];

        if (isTcuTreasury) {
          data = await getAllReimbursements();
        } else {
          if (!treasurerClubId) {
            data = [];
          } else {
            data = await getReimbursementsByClubId(treasurerClubId);
          }
        }

        if (!cancelled) setReimbursements(data);
      } catch (e) {
        const axiosErr = e as { response?: { data?: { message?: string } }; message?: string };
        const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to fetch reimbursements";
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, userId, isTcuTreasury, treasurerClubId]);

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup ?? undefined;
  }, [fetchData]);

  const showFilters = subTab !== "members";

  return (
    <div className="px-4 sm:px-6 lg:px-[32px] pt-[16px]">
      <div className="flex mb-4 border-b border-gray-200">
        <button
          onClick={() => setSubTab("unpaid")}
          className={`w-[80px] sm:w-[100px] lg:w-[120px] text-center text-sm sm:text-base lg:text-lg font-[family-name:var(--font-public-sans)] font-medium py-2 sm:py-3 cursor-pointer ${
            subTab === "unpaid" ? "border-b-2 border-[#3172AE] text-black" : "text-[#8D8B8B]"
          }`}
        >
          Unpaid
        </button>
        <button
          onClick={() => setSubTab("paid")}
          className={`w-[80px] sm:w-[100px] lg:w-[120px] text-center text-sm sm:text-base lg:text-lg font-[family-name:var(--font-public-sans)] font-medium py-2 sm:py-3 cursor-pointer ${
            subTab === "paid" ? "border-b-2 border-[#3172AE] text-black" : "text-[#8D8B8B]"
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setSubTab("members")}
          className={`w-[110px] sm:w-[140px] lg:w-[160px] text-center text-sm sm:text-base lg:text-lg font-[family-name:var(--font-public-sans)] font-medium py-2 sm:py-3 cursor-pointer ${
            subTab === "members" ? "border-b-2 border-[#3172AE] text-black" : "text-[#8D8B8B]"
          }`}
        >
          Club Members
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3">
          {/* Club filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-[family-name:var(--font-pt-sans)] whitespace-nowrap">
              Club
            </span>
            <select
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#3172AE] font-[family-name:var(--font-pt-sans)] bg-white text-gray-700"
            >
              <option value="">All clubs</option>
              {allClubs.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Status filter — only on unpaid tab */}
          {subTab === "unpaid" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-[family-name:var(--font-pt-sans)] whitespace-nowrap">
                Status
              </span>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map(({ value, label, active, inactive }) => (
                  <button
                    key={value}
                    onClick={() => toggleStatus(value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all font-[family-name:var(--font-pt-sans)] ${
                      filterStatuses.has(value) ? active : inactive
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="h-[calc(100vh-220px)] sm:h-[calc(100vh-240px)] lg:h-[calc(100vh-260px)] overflow-y-auto">
        {subTab === "unpaid" && <DataTable data={filteredUnpaidRows} showDelete={false} onRefresh={fetchData} />}
        {subTab === "paid" && <DataTable data={filteredPaidRows} showDelete={false} onRefresh={fetchData} />}
        {subTab === "members" && <ClubMembers />}
      </div>
    </div>
  );
}
