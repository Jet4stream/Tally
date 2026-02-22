"use client";

import { useState } from "react";

// ── Dummy Data ────────────────────────────────────────────────────────────────

const EVENTS = [
  {
    id: 1,
    name: "Spring General Interest Meeting",
    foodBudget: 50,
    nonFoodBudget: 40,
    lineItems: [],
  },
  {
    id: 2,
    name: "Dumpling Night",
    foodBudget: 1000,
    nonFoodBudget: 200,
    lineItems: [],
  },
  {
    id: 3,
    name: "Formal",
    foodBudget: 500,
    nonFoodBudget: 400,
    lineItems: [
      { name: "Finger foods, drinks, Taiwanese dessert", allocated: 1000, spent: 500 },
      { name: "Decorations", allocated: 200, spent: 0 },
      { name: "Transportation", allocated: 500, spent: 300 },
    ],
  },
  {
    id: 4,
    name: "Lantern Making",
    foodBudget: 0,
    nonFoodBudget: 50,
    lineItems: [],
  },
];

const SUMMARY = {
  totalFoodBudget: 5000,
  totalNonFoodBudget: 10000,
  totalSpent: 10000,
  totalBudget: 15000,
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function BudgetSheet() {
  const [expandedIds, setExpandedIds] = useState<number[]>([3]);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [reallocateOpen, setReallocateOpen] = useState(false);
  const [reallocateType, setReallocateType] = useState<"Food" | "Non-Food">("Food");
  const [reallocateAmount, setReallocateAmount] = useState("");
  const [reallocateFrom, setReallocateFrom] = useState("");
  const [reallocateTo, setReallocateTo] = useState("");

  const toggle = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const remaining = SUMMARY.totalBudget - SUMMARY.totalSpent;
  const foodPct = Math.round((SUMMARY.totalFoodBudget / SUMMARY.totalBudget) * 100);

  return (
    <div className="relative flex p-6 bg-gray-50 min-h-full transition-all duration-300">
      {/* ── Left: Main budget table ── */}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold font-[family-name:var(--font-public-sans)] text-[36px] leading-none tracking-normal text-gray-900 mb-4">
          2025-2026 Academic Year
        </h1>

        {/* Column legend */}
        <div className="flex justify-end items-center gap-1 text-xs mb-3 pr-10">
          <span className="text-gray-400 uppercase tracking-wide mr-1">Line Items:</span>
          <span className="text-green-600 font-medium">Allocated</span>
          <span className="text-gray-400 mx-1">-</span>
          <span className="text-red-500 font-medium">Spent</span>
          <span className="text-gray-400 mx-1">=</span>
          <span className="text-gray-600 font-medium">Remaining</span>
        </div>

        {/* Event rows */}
        <div className="flex flex-col gap-3">
          {EVENTS.map((event) => {
            const isExpanded = expandedIds.includes(event.id);
            return (
              <div key={event.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                {/* Event header row */}
                <button
                  onClick={() => toggle(event.id)}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 font-[family-name:var(--font-public-sans)] text-2xl leading-none tracking-normal shrink-0 mr-8">
                    {event.name}
                  </span>
                  <span className="ml-auto flex items-baseline gap-1 font-[family-name:var(--font-public-sans)] text-2xl leading-none">
                    <span className="font-extralight text-gray-500">Food:</span>
                    <span className="font-medium text-gray-900">${event.foodBudget.toLocaleString()}</span>
                  </span>
                  <span className="ml-12 flex items-baseline gap-1 font-[family-name:var(--font-public-sans)] text-2xl leading-none">
                    <span className="font-extralight text-gray-500">Non-Food:</span>
                    <span className="font-medium text-gray-900">${event.nonFoodBudget.toLocaleString()}</span>
                  </span>
                  <span className="ml-8 text-gray-400">
                    {isExpanded ? "∧" : "∨"}
                  </span>
                </button>

                {/* Expanded line items */}
                {isExpanded && event.lineItems.length > 0 && (
                  <div className="border-t border-gray-100">
                    {event.lineItems.map((item, idx) => {
                      const rem = item.allocated - item.spent;
                      return (
                        <div
                          key={idx}
                          className="flex items-center px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 bg-gray-50"
                        >
                          <span className="text-gray-600 shrink-0 whitespace-nowrap font-[family-name:var(--font-pt-sans)] font-normal text-lg leading-none">{item.name}</span>
                          <div className="ml-auto flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-medium">${item.allocated.toLocaleString()}</span>
                            <span className="text-gray-400">-</span>
                            <span className="text-red-500 font-medium">${item.spent.toLocaleString()}</span>
                            <span className="text-gray-400">=</span>
                            <span className="text-gray-700 font-medium w-16 text-right">${rem.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && event.lineItems.length === 0 && (
                  <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-400 bg-gray-50">
                    No line items yet.
                  </div>
                )}
              </div>
            );
          })}

          {/* Remaining Total summary row */}
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => setSummaryExpanded((p) => !p)}
              className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-[#3172AE] font-[family-name:var(--font-public-sans)] text-2xl leading-none tracking-normal">
                Remaining Total: ${remaining.toLocaleString()}
              </span>
              <span className="ml-auto text-gray-400">
                {summaryExpanded ? "∧" : "∨"}
              </span>
            </button>

            {summaryExpanded && (
              <div className="border-t border-gray-100">
                {[
                  { label: "Total Food Budget", value: `$${SUMMARY.totalFoodBudget.toLocaleString()}` },
                  { label: "Total Non-Food Budget", value: `$${SUMMARY.totalNonFoodBudget.toLocaleString()}` },
                  { label: "% of Budget as Food", value: `${foodPct}%` },
                  { label: "Total Spent", value: `$${SUMMARY.totalSpent.toLocaleString()}` },
                  { label: "Total Budget", value: `$${SUMMARY.totalBudget.toLocaleString()}` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 bg-gray-50">
                    <span className="text-gray-600 font-[family-name:var(--font-pt-sans)] font-normal text-lg leading-none whitespace-nowrap">{row.label}</span>
                    <span className="text-gray-800 font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Reallocate Budget panel ── */}
      <div className={`transition-all duration-300 shrink-0 ${reallocateOpen ? "w-96 ml-6" : "w-auto ml-4"}`}>
        {!reallocateOpen ? (
          <button
            onClick={() => setReallocateOpen(true)}
            className="flex flex-col items-center gap-3 bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-24 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-400 text-sm font-medium">«</span>
            <span className="text-gray-500 text-[11px] font-medium tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">
              Reallocate Budget
            </span>
          </button>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-white p-7">
            <div className="mb-3">
              <button onClick={() => setReallocateOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-medium mb-4 block">»</button>
              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-xl">⇄</span>
                <h2 className="font-semibold font-[family-name:var(--font-public-sans)] text-[28px] leading-none tracking-normal text-gray-900">
                  Reallocate Budget
                </h2>
              </div>
            </div>

            <p className="text-gray-500 text-xs mb-4">Move money between events. These changes will be reflected for you and TCU.</p>

            {/* Food / Non-Food toggle */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 mb-4 w-fit">
              {(["Food", "Non-Food"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReallocateType(type)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    reallocateType === type
                      ? "bg-white text-gray-900 font-bold shadow-sm"
                      : "text-gray-400 font-normal"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">Amount to Move</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm outline-none focus:border-[#3172AE]"
                  placeholder=""
                  value={reallocateAmount}
                  onChange={(e) => setReallocateAmount(e.target.value)}
                  type="number"
                  min="0"
                />
              </div>
            </div>

            {/* Event Taking From */}
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">Event Taking From</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3172AE]"
                value={reallocateFrom}
                onChange={(e) => setReallocateFrom(e.target.value)}
              />
            </div>

            {/* Event Adding To */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Event Adding To</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3172AE]"
                value={reallocateTo}
                onChange={(e) => setReallocateTo(e.target.value)}
              />
            </div>

            <button className="w-full bg-[#3172AE] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#2860a0] transition-colors">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}