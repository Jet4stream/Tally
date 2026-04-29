"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BudgetSection, BudgetItem } from "@prisma/client";
import { BudgetCategory } from "@prisma/client";
import { getBudgetSectionsByClubId } from "@/lib/api/budgetSection";
import { getBudgetItemsBySectionId, updateBudgetItem } from "@/lib/api/budgetItem";

function moneyFromCents(n: number) {
  return n / 100;
}

function formatMoney(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function getItemKind(it: BudgetItem): "Food" | "Non-Food" {
  return it.category === BudgetCategory.FOOD ? "Food" : "Non-Food";
}

function centsFromDollarsInput(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

type Option = {
  value: string;
  label: string;
  item: BudgetItem;
  section: BudgetSection;
};

function buildOptions(
  sections: BudgetSection[],
  itemsBySectionId: Record<string, BudgetItem[]>,
  kind: "Food" | "Non-Food"
): Option[] {
  const opts: Option[] = [];
  for (const sec of sections) {
    const items = itemsBySectionId[sec.id] ?? [];
    for (const it of items) {
      if (getItemKind(it) !== kind) continue;
      opts.push({
        value: it.id,
        label: `${sec.title} - ${it.label}`,
        item: it,
        section: sec,
      });
    }
  }
  opts.sort((a, b) => a.label.localeCompare(b.label));
  return opts;
}

interface ReallocateBudgetProps {
  clubId: string;
  onReallocated?: () => void;
}

export default function ReallocateBudget({ clubId, onReallocated }: ReallocateBudgetProps) {
  const [sections, setSections] = useState<BudgetSection[]>([]);
  const [itemsBySectionId, setItemsBySectionId] = useState<Record<string, BudgetItem[]>>({});
  const [fetchKey, setFetchKey] = useState(0);

  const [reallocateType, setReallocateType] = useState<"Food" | "Non-Food">("Food");
  const [reallocateAmount, setReallocateAmount] = useState("");
  const [reallocateFromId, setReallocateFromId] = useState<string>("");
  const [reallocateToId, setReallocateToId] = useState<string>("");
  const [reallocateSaving, setReallocateSaving] = useState(false);
  const [reallocateError, setReallocateError] = useState<string>("");

  useEffect(() => {
    setReallocateType("Food");
    setReallocateAmount("");
    setReallocateFromId("");
    setReallocateToId("");
    setReallocateError("");
  }, [clubId]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    (async () => {
      try {
        const secs = await getBudgetSectionsByClubId(clubId);
        if (!cancelled) setSections(secs);
      } catch (e) {
        console.error("Failed to fetch budget sections:", e);
        if (!cancelled) setSections([]);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId, fetchKey]);

  useEffect(() => {
    if (sections.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.allSettled(
          sections.map((s) => getBudgetItemsBySectionId(s.id))
        );
        if (cancelled) return;
        const next: Record<string, BudgetItem[]> = {};
        results.forEach((res, idx) => {
          const sectionId = sections[idx]!.id;
          next[sectionId] = res.status === "fulfilled" ? res.value : [];
        });
        setItemsBySectionId(next);
      } catch (e) {
        console.error("Failed to prefetch items:", e);
        if (!cancelled) setItemsBySectionId({});
      }
    })();
    return () => { cancelled = true; };
  }, [sections]);

  useEffect(() => {
    setReallocateFromId("");
    setReallocateToId("");
    setReallocateError("");
  }, [reallocateType]);

  const reallocateOptions = useMemo(
    () => buildOptions(sections, itemsBySectionId, reallocateType),
    [sections, itemsBySectionId, reallocateType]
  );

  const fromOpt = useMemo(
    () => reallocateOptions.find((o) => o.value === reallocateFromId),
    [reallocateOptions, reallocateFromId]
  );

  const toOpt = useMemo(
    () => reallocateOptions.find((o) => o.value === reallocateToId),
    [reallocateOptions, reallocateToId]
  );

  const handleSaveReallocation = useCallback(async () => {
    setReallocateError("");

    const cents = centsFromDollarsInput(reallocateAmount);
    if (!cents) {
      setReallocateError("Enter a valid amount greater than 0.");
      return;
    }
    if (!fromOpt || !toOpt) {
      setReallocateError("Select both an event to take from and an event to add to.");
      return;
    }
    if (fromOpt.value === toOpt.value) {
      setReallocateError("Choose two different events.");
      return;
    }

    const fromAllocated = Number(fromOpt.item.allocatedCents ?? 0);
    const fromSpent = Number(fromOpt.item.spentCents ?? 0);
    const fromRemaining = fromAllocated - fromSpent;

    if (cents > fromRemaining) {
      setReallocateError(
        `Not enough remaining in "${fromOpt.label}". Remaining is ${formatMoney(moneyFromCents(fromRemaining))}.`
      );
      return;
    }

    const newFromAllocated = fromAllocated - cents;
    const toAllocated = Number(toOpt.item.allocatedCents ?? 0);
    const newToAllocated = toAllocated + cents;

    setReallocateSaving(true);
    try {
      // NOTE: Not atomic (two calls). Works for now.
      await updateBudgetItem(fromOpt.value, { allocatedCents: newFromAllocated });
      await updateBudgetItem(toOpt.value, { allocatedCents: newToAllocated });

      setReallocateAmount("");
      setReallocateFromId("");
      setReallocateToId("");
      setFetchKey((k) => k + 1);
      onReallocated?.();
    } catch (e) {
      console.error("Reallocation failed:", e);
      setReallocateError("Failed to save changes. Please try again.");
    } finally {
      setReallocateSaving(false);
    }
  }, [reallocateAmount, fromOpt, toOpt, onReallocated]);

  return (
    <>
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 text-xl">⇄</span>
          <h2 className="font-semibold font-[family-name:var(--font-public-sans)] text-[28px] leading-none tracking-normal text-gray-900">
            Reallocate Budget
          </h2>
        </div>
      </div>

      <p className="text-gray-500 text-xs mb-4 font-[family-name:var(--font-pt-sans)]">
        Move money between events. These changes will be reflected for you and TCU.
      </p>

      <div className="flex items-center bg-gray-100 rounded-full p-1 mb-4 w-fit">
        {(["Food", "Non-Food"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReallocateType(type)}
            className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 font-[family-name:var(--font-pt-sans)] ${
              reallocateType === type
                ? "bg-white text-gray-900 font-bold shadow-sm"
                : "text-gray-400 font-normal"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-500 mb-1 block font-[family-name:var(--font-pt-sans)]">
          Amount to Move
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm outline-none focus:border-[#3172AE] font-[family-name:var(--font-pt-sans)]"
            value={reallocateAmount}
            onChange={(e) => setReallocateAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-500 mb-1 block font-[family-name:var(--font-pt-sans)]">
          Event Taking From
        </label>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3172AE] font-[family-name:var(--font-pt-sans)] bg-white"
          value={reallocateFromId}
          onChange={(e) => setReallocateFromId(e.target.value)}
        >
          <option value="" disabled>Select…</option>
          {reallocateOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {fromOpt && (
          <p className="mt-1 text-[11px] text-gray-500 font-[family-name:var(--font-pt-sans)]">
            Remaining:{" "}
            {formatMoney(
              moneyFromCents(
                (Number(fromOpt.item.allocatedCents) || 0) -
                  (Number(fromOpt.item.spentCents) || 0)
              )
            )}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500 mb-1 block font-[family-name:var(--font-pt-sans)]">
          Event Adding To
        </label>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3172AE] font-[family-name:var(--font-pt-sans)] bg-white"
          value={reallocateToId}
          onChange={(e) => setReallocateToId(e.target.value)}
        >
          <option value="" disabled>Select…</option>
          {reallocateOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {reallocateError && (
        <div className="text-red-600 text-xs mb-3 font-[family-name:var(--font-pt-sans)]">
          {reallocateError}
        </div>
      )}

      <button
        onClick={handleSaveReallocation}
        disabled={reallocateSaving}
        className="w-full bg-[#3172AE] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#2860a0] transition-colors font-[family-name:var(--font-public-sans)] disabled:opacity-50"
      >
        {reallocateSaving ? "Saving..." : "Save Changes"}
      </button>
    </>
  );
}
