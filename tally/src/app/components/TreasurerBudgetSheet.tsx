"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BudgetSection, BudgetItem } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { BudgetCategory } from "@prisma/client";
import { useTreasurerStore } from "@/store/treasurerStore";
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

type Rollup = {
  allocated: number;
  spent: number;
  remaining: number;
  foodRemaining: number;
  nonFoodRemaining: number;
};

function rollupItems(items: BudgetItem[]): Rollup {
  let allocated = 0;
  let spent = 0;
  let foodRemaining = 0;
  let nonFoodRemaining = 0;

  for (const it of items) {
    const a = Number(it.allocatedCents ?? 0);
    const s = Number(it.spentCents ?? 0);
    const rem = a - s;

    allocated += a;
    spent += s;

    const kind = getItemKind(it);
    if (kind === "Food") foodRemaining += rem;
    else nonFoodRemaining += rem;
  }

  return {
    allocated,
    spent,
    remaining: allocated - spent,
    foodRemaining,
    nonFoodRemaining,
  };
}

function centsFromDollarsInput(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

type Option = {
  value: string; // itemId
  label: string; // "Section - Item"
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

interface BudgetSheetProps {
  forcedClubId?: string;
  hideReallocate?: boolean;
}

export default function BudgetSheet({
  forcedClubId,
  hideReallocate = false,
}: BudgetSheetProps) {
  const { user, isLoaded } = useUser();
  const treasurerClubIdGlobal = useTreasurerStore((s) => s.treasurerClubId);

  const [treasurerClubId, setTreasurerClubId] = useState<string | null>(
    forcedClubId || null
  );
  const [sections, setSections] = useState<BudgetSection[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [itemsBySectionId, setItemsBySectionId] = useState<
    Record<string, BudgetItem[]>
  >({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  // --- Reallocate state ---
  const [reallocateOpen, setReallocateOpen] = useState(false);
  const [reallocateType, setReallocateType] = useState<"Food" | "Non-Food">(
    "Food"
  );
  const [reallocateAmount, setReallocateAmount] = useState("");
  const [reallocateFromId, setReallocateFromId] = useState<string>("");
  const [reallocateToId, setReallocateToId] = useState<string>("");
  const [reallocateSaving, setReallocateSaving] = useState(false);
  const [reallocateError, setReallocateError] = useState<string>("");

  useEffect(() => {
    if (forcedClubId) {
      setTreasurerClubId(forcedClubId);
    } else if (isLoaded && user) {
      setTreasurerClubId(treasurerClubIdGlobal);
    }
  }, [forcedClubId, treasurerClubIdGlobal, isLoaded, user]);

  useEffect(() => {
    if (!treasurerClubId) return;
    let cancelled = false;
    (async () => {
      try {
        const secs = await getBudgetSectionsByClubId(treasurerClubId);
        if (!cancelled) setSections(secs);
      } catch (e) {
        console.error("Failed to fetch budget sections:", e);
        if (!cancelled) setSections([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [treasurerClubId]);

  useEffect(() => {
    if (sections.length === 0) return;
    let cancelled = false;
    (async () => {
      setItemsLoading(true);
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
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sections]);

  const isExpanded = useCallback(
    (id: string) => expandedIds.has(id),
    [expandedIds]
  );

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sectionRollups = useMemo(() => {
    const map: Record<string, Rollup> = {};
    for (const s of sections) {
      map[s.id] = rollupItems(itemsBySectionId[s.id] ?? []);
    }
    return map;
  }, [sections, itemsBySectionId]);

  const summary = useMemo(() => {
    const allItems = Object.values(itemsBySectionId).flat();
    const r = rollupItems(allItems);
    return {
      totalFoodLeft: r.foodRemaining,
      totalNonFoodLeft: r.nonFoodRemaining,
      totalSpent: r.spent,
      totalBudget: r.allocated,
      remaining: r.remaining,
    };
  }, [itemsBySectionId]);

  const reallocateOptions = useMemo(() => {
    return buildOptions(sections, itemsBySectionId, reallocateType);
  }, [sections, itemsBySectionId, reallocateType]);

  const fromOpt = useMemo(
    () => reallocateOptions.find((o) => o.value === reallocateFromId),
    [reallocateOptions, reallocateFromId]
  );

  const toOpt = useMemo(
    () => reallocateOptions.find((o) => o.value === reallocateToId),
    [reallocateOptions, reallocateToId]
  );

  useEffect(() => {
    // reset selections when switching type
    setReallocateFromId("");
    setReallocateToId("");
    setReallocateError("");
  }, [reallocateType]);

  const handleSaveReallocation = async () => {
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

    // Validate remaining in FROM (allocated - spent)
    const fromAllocated = Number(fromOpt.item.allocatedCents ?? 0);
    const fromSpent = Number(fromOpt.item.spentCents ?? 0);
    const fromRemaining = fromAllocated - fromSpent;

    if (cents > fromRemaining) {
      setReallocateError(
        `Not enough remaining in "${fromOpt.label}". Remaining is ${formatMoney(
          moneyFromCents(fromRemaining)
        )}.`
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

      // Patch local state so UI updates instantly
      setItemsBySectionId((prev) => {
        const next: Record<string, BudgetItem[]> = { ...prev };

        const patch = (sectionId: string, itemId: string, allocatedCents: number) => {
          next[sectionId] = (next[sectionId] ?? []).map((it) =>
            it.id === itemId ? { ...it, allocatedCents } : it
          );
        };

        patch(fromOpt.item.sectionId, fromOpt.value, newFromAllocated);
        patch(toOpt.item.sectionId, toOpt.value, newToAllocated);

        return next;
      });

      // clear + close
      setReallocateAmount("");
      setReallocateFromId("");
      setReallocateToId("");
      setReallocateOpen(false);
    } catch (e) {
      console.error("Reallocation failed:", e);
      setReallocateError("Failed to save changes. Please try again.");
    } finally {
      setReallocateSaving(false);
    }
  };

  return (
    <div className="relative flex p-6 bg-white min-h-full transition-all duration-300">
      <div className="flex-1 min-w-0">
        <div className="flex items-end justify-between mb-4">
          <h1 className="font-semibold font-[family-name:var(--font-public-sans)] text-[36px] leading-none tracking-normal text-gray-900">
            2025-2026 Academic Year
          </h1>
          {itemsLoading && (
            <span className="text-xs text-gray-400">Loading line items…</span>
          )}
        </div>

        <div className="flex justify-end items-center gap-1 text-xs mb-3 pr-10">
          <span className="text-gray-400 uppercase tracking-wide mr-1 font-[family-name:var(--font-pt-sans)]">
            Line Items:
          </span>
          <span className="text-green-600 font-medium font-[family-name:var(--font-pt-sans)]">
            Allocated
          </span>
          <span className="text-gray-400 mx-1">-</span>
          <span className="text-red-500 font-medium font-[family-name:var(--font-pt-sans)]">
            Spent
          </span>
          <span className="text-gray-400 mx-1">=</span>
          <span className="text-gray-600 font-medium font-[family-name:var(--font-pt-sans)]">
            Remaining
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {sections.map((section) => {
            const open = isExpanded(section.id);
            const items = itemsBySectionId[section.id] ?? [];
            const r = sectionRollups[section.id] ?? {
              allocated: 0,
              spent: 0,
              remaining: 0,
              foodRemaining: 0,
              nonFoodRemaining: 0,
            };

            const foodLeft = moneyFromCents(r.foodRemaining);
            const nonFoodLeft = moneyFromCents(r.nonFoodRemaining);

            return (
              <div
                key={section.id}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 font-[family-name:var(--font-public-sans)] text-2xl leading-none tracking-normal shrink-0 mr-8">
                    {section.title}
                  </span>

                  <span className="ml-auto flex items-baseline gap-2 font-[family-name:var(--font-public-sans)] text-2xl leading-none">
                    <span className="font-extralight text-gray-500">
                      Food left:
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(foodLeft)}
                    </span>
                  </span>

                  <span className="ml-12 flex items-baseline gap-2 font-[family-name:var(--font-public-sans)] text-2xl leading-none">
                    <span className="font-extralight text-gray-500">
                      Non-food left:
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(nonFoodLeft)}
                    </span>
                  </span>

                  <span className="ml-8 text-gray-400">{open ? "∧" : "∨"}</span>
                </button>

                {open && (
                  <div className="border-t border-gray-100">
                    {items.length > 0 ? (
                      items.map((item) => {
                        const a = moneyFromCents(Number(item.allocatedCents) || 0);
                        const sp = moneyFromCents(Number(item.spentCents) || 0);
                        const rem = a - sp;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 bg-gray-50"
                          >
                            <span className="text-gray-600 shrink-0 whitespace-nowrap font-[family-name:var(--font-pt-sans)] font-normal text-lg leading-none">
                              {item.label}
                            </span>

                            <div className="ml-auto flex items-center gap-2 text-sm">
                              <span className="text-green-600 font-medium font-[family-name:var(--font-pt-sans)]">
                                {formatMoney(a)}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className="text-red-500 font-medium font-[family-name:var(--font-pt-sans)]">
                                {formatMoney(sp)}
                              </span>
                              <span className="text-gray-400">=</span>
                              <span className="text-gray-700 font-medium w-24 text-right font-[family-name:var(--font-pt-sans)]">
                                {formatMoney(rem)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400 bg-gray-50 font-[family-name:var(--font-pt-sans)]">
                        No line items yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => setSummaryExpanded((p) => !p)}
              className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-[#3172AE] font-[family-name:var(--font-public-sans)] text-2xl leading-none tracking-normal">
                Remaining Total: {formatMoney(moneyFromCents(summary.remaining))}
              </span>
              <span className="ml-auto text-gray-400">
                {summaryExpanded ? "∧" : "∨"}
              </span>
            </button>

            {summaryExpanded && (
              <div className="border-t border-gray-100">
                {[
                  {
                    label: "Total Food Left",
                    value: formatMoney(moneyFromCents(summary.totalFoodLeft)),
                  },
                  {
                    label: "Total Non-Food Left",
                    value: formatMoney(moneyFromCents(summary.totalNonFoodLeft)),
                  },
                  {
                    label: "Total Spent",
                    value: formatMoney(moneyFromCents(summary.totalSpent)),
                  },
                  {
                    label: "Total Budget",
                    value: formatMoney(moneyFromCents(summary.totalBudget)),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 bg-gray-50"
                  >
                    <span className="text-gray-600 font-[family-name:var(--font-pt-sans)] font-normal text-lg leading-none whitespace-nowrap">
                      {row.label}
                    </span>
                    <span className="text-gray-800 font-medium font-[family-name:var(--font-pt-sans)]">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {!hideReallocate && (
        <div
          className={`transition-all duration-300 shrink-0 ${
            reallocateOpen ? "w-96 ml-6" : "w-auto ml-4"
          }`}
        >
          {!reallocateOpen ? (
            <button
              onClick={() => setReallocateOpen(true)}
              className="flex flex-col items-center gap-3 bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-24 hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-400 text-sm font-medium">«</span>
              <span className="text-gray-500 text-[11px] font-medium tracking-widest uppercase [writing-mode:vertical-rl] rotate-180 font-[family-name:var(--font-pt-sans)]">
                Reallocate Budget
              </span>
            </button>
          ) : (
            <div className="border border-gray-200 rounded-lg bg-white p-7">
              <div className="mb-3">
                <button
                  onClick={() => setReallocateOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-medium mb-4 block"
                >
                  »
                </button>
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
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
                  <option value="" disabled>
                    Select…
                  </option>
                  {reallocateOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
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
                  <option value="" disabled>
                    Select…
                  </option>
                  {reallocateOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}