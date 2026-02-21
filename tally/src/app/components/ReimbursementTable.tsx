"use client";
import { useState, useEffect } from "react";
import DataTable from "./DataTable";

//need to import the reimbursement functions and types from the api file to fetch the data for the table
import { getUnpaidReimbursements, getPaidReimbursements, Reimbursement }

export default function ReimbursementTable() {
  const [subTab, setSubTab] = useState("unpaid");
  const [unpaidData, setUnpaidData] = useState<Reimbursement[]>([]);
  const [paidData, setPaidData] = useState<Reimbursement[]>([]);

  useEffect(() => {
    getUnpaidReimbursements().then(setUnpaidData);
    getPaidReimbursements().then(setPaidData);
  }, []);

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

      {subTab === "unpaid" && <DataTable data={unpaidData} showDelete={true} />}
      {subTab === "paid" && <DataTable data={paidData} showDelete={false} />}
      {subTab === "members" && <div>Club Members content</div>}
    </div>
  );
}