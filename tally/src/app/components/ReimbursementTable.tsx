"use client";
import { useState, useEffect, useMemo } from "react";
import DataTable from "./DataTable";
import { Reimbursement } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { getReimbursementsByPayeeUserId } from "@/lib/api/reimbursement";

const unpaidData = [
  { date: "2/20/26", payTo: "Ashley Wu", owed: "$46.79", item: "Dumpling wrappers", event: "Dumpling Night", status: "Submitted to TCU", statusColor: "text-gray-600" },
  { date: "2/20/26", payTo: "Jet Yotsuuye", owed: "$13.90", item: "Oreos", event: "Lantern Making", status: "Rejected", statusColor: "text-red-500" },
  { date: "1/23/26", payTo: "Kalen Lauring", owed: "$57.89", item: "Rice", event: "Dumpling Night", status: "Reimbursement processing", statusColor: "text-green-600" },
  { date: "1/23/26", payTo: "Claire Lee", owed: "$75.43", item: "Hi chews, pineapple cakes, jelly", event: "General Interesting Meeting", status: "Submitted to TCU", statusColor: "text-gray-600" },
  { date: "1/23/26", payTo: "Justin Paik", owed: "$75.43", item: "Hi chews, pineapple cakes, jelly", event: "General Interesting Meeting", status: "Submitted to TCU", statusColor: "text-gray-600" },
  { date: "1/23/26", payTo: "Kevin Lu", owed: "$75.43", item: "Hi chews, pineapple cakes, jelly", event: "General Interesting Meeting", status: "Submitted to TCU", statusColor: "text-gray-600" },
];

const paidData = [
  { date: "1/10/26", payTo: "Ashley Wu", owed: "$32.50", item: "Plates and cups", event: "Welcome Back Party", status: "Paid", statusColor: "text-gray-600" },
  { date: "1/05/26", payTo: "Kalen Lauring", owed: "$45.00", item: "Decorations", event: "Welcome Back Party", status: "Paid", statusColor: "text-gray-600" },
];

export default function ReimbursementTable() {
  const [subTab, setSubTab] = useState<string>("unpaid");
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { user, isLoaded } = useUser();
  const userId = user?.id; 


  const { unpaidRows, paidRows } = useMemo(() => {
    const mapped = reimbursements.map((r) => ({
      date: new Date(r.submittedAt).toLocaleDateString("en-US"),
      payTo: r.payeeUserId,
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
    if (!isLoaded) return;
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getReimbursementsByPayeeUserId(userId);
        if (!cancelled) setReimbursements(data);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to fetch reimbursements";
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);


  return (
    <div className="px-[32px] pt-[16px]">
      <div className="flex gap-6 mb-4">
        <button
          onClick={() => setSubTab("unpaid")}
          className={`text-base font-[family-name:var(--font-public-sans)] pb-1 ${
            subTab === "unpaid" ? "font-bold border-b-2 border-black" : "text-gray-400"
          }`}
        >
          Unpaid
        </button>
        <button
          onClick={() => setSubTab("paid")}
          className={`text-base font-[family-name:var(--font-public-sans)] pb-1 ${
            subTab === "paid" ? "font-bold border-b-2 border-black" : "text-gray-400"
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setSubTab("members")}
          className={`text-base font-[family-name:var(--font-public-sans)] pb-1 ${
            subTab === "members" ? "font-bold border-b-2 border-black" : "text-gray-400"
          }`}
        >
          Club Members
        </button>
      </div>

    {subTab === "unpaid" && <DataTable data={unpaidRows} showDelete={true} />}
    {subTab === "paid" && <DataTable data={paidRows} showDelete={false} />}
      {subTab === "members" && <div>Club Members content</div>}
    </div>
  );
}
