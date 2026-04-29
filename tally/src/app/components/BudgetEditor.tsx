"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetItem } from "@prisma/client";
import { BudgetCategory } from "@prisma/client";
import { useTreasurerStore } from "@/store/treasurerStore";
import {
  getBudgetSectionsByClubId,
  createBudgetSection,
  updateBudgetSection,
  deleteBudgetSection,
} from "@/lib/api/budgetSection";
import {
  getBudgetItemsBySectionId,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from "@/lib/api/budgetItem";

type DraftItem = {
  _key: string;
  id?: string;
  label: string;
  category: BudgetCategory;
  allocatedDollars: string;
  _deleted: boolean;
};

type DraftSection = {
  _key: string;
  id?: string;
  title: string;
  items: DraftItem[];
  _deleted: boolean;
};

interface BudgetEditorProps {
  clubId: string;
  clubName?: string;
  year: number;
}

let _counter = 0;
function nextKey() {
  return `dk-${++_counter}-${Date.now()}`;
}

function toDollars(cents: number | bigint) {
  return (Number(cents) / 100).toFixed(2);
}

function toCents(dollars: string) {
  const n = parseFloat(dollars || "0");
  return isNaN(n) ? 0 : Math.max(0, Math.round(n * 100));
}

function formatMoney(cents: number) {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sectionsFromApi(
  secs: { id: string; title: string }[],
  itemResults: PromiseSettledResult<BudgetItem[]>[]
): DraftSection[] {
  return secs.map((sec, idx) => {
    const items: BudgetItem[] =
      itemResults[idx].status === "fulfilled" ? itemResults[idx].value : [];
    return {
      _key: sec.id,
      id: sec.id,
      title: sec.title,
      _deleted: false,
      items: items.map((it) => ({
        _key: it.id,
        id: it.id,
        label: it.label,
        category: it.category,
        allocatedDollars: toDollars(it.allocatedCents),
        _deleted: false,
      })),
    };
  });
}

function sectionTotals(items: DraftItem[]) {
  let food = 0;
  let nonFood = 0;
  for (const it of items) {
    if (it._deleted) continue;
    const c = toCents(it.allocatedDollars);
    if (it.category === BudgetCategory.FOOD) food += c;
    else nonFood += c;
  }
  return { food, nonFood };
}

export default function BudgetEditor({ clubId, clubName, year }: BudgetEditorProps) {
  const router = useRouter();
  const isTCU = useTreasurerStore((s) => s.isTCU);

  const [draftSections, setDraftSections] = useState<DraftSection[]>([]);
  const [originalSections, setOriginalSections] = useState<DraftSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCopyPrompt, setShowCopyPrompt] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const secs = await getBudgetSectionsByClubId(clubId, year);
      const results = await Promise.allSettled(secs.map((s) => getBudgetItemsBySectionId(s.id)));
      const draft = sectionsFromApi(secs, results);
      setDraftSections(draft);
      setOriginalSections(draft);
      if (draft.length === 0) setShowCopyPrompt(true);
    } catch (e) {
      console.error("Failed to load budget:", e);
    } finally {
      setLoading(false);
    }
  }, [clubId, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global summary across all active sections/items
  const globalSummary = useMemo(() => {
    let food = 0;
    let nonFood = 0;
    for (const sec of draftSections) {
      if (sec._deleted) continue;
      const t = sectionTotals(sec.items);
      food += t.food;
      nonFood += t.nonFood;
    }
    return { food, nonFood, total: food + nonFood };
  }, [draftSections]);

  const hasChanges = useMemo(() => {
    // Any existing section deleted or any new section added
    if (draftSections.some((s) => s._deleted && s.id)) return true;
    if (draftSections.some((s) => !s._deleted && !s.id)) return true;

    for (const section of draftSections.filter((s) => !s._deleted && s.id)) {
      const orig = originalSections.find((o) => o.id === section.id);
      if (!orig || section.title !== orig.title) return true;

      if (section.items.some((it) => it._deleted && it.id)) return true;
      if (section.items.some((it) => !it._deleted && !it.id)) return true;

      for (const item of section.items.filter((it) => !it._deleted && it.id)) {
        const origItem = orig.items.find((oi) => oi.id === item.id);
        if (!origItem) return true;
        if (
          item.label !== origItem.label ||
          item.category !== origItem.category ||
          toCents(item.allocatedDollars) !== toCents(origItem.allocatedDollars)
        )
          return true;
      }
    }
    return false;
  }, [draftSections, originalSections]);

  const handleStartFresh = () => setShowCopyPrompt(false);

  const handleCopyFromPrevYear = async () => {
    setCopyLoading(true);
    try {
      const secs = await getBudgetSectionsByClubId(clubId, year - 1);
      const results = await Promise.allSettled(secs.map((s) => getBudgetItemsBySectionId(s.id)));
      const draft: DraftSection[] = secs.map((sec, idx) => {
        const items: BudgetItem[] =
          results[idx].status === "fulfilled" ? results[idx].value : [];
        return {
          _key: nextKey(),
          id: undefined,
          title: sec.title,
          _deleted: false,
          items: items.map((it) => ({
            _key: nextKey(),
            id: undefined,
            label: it.label,
            category: it.category,
            allocatedDollars: toDollars(it.allocatedCents),
            _deleted: false,
          })),
        };
      });
      setDraftSections(draft);
      setShowCopyPrompt(false);
    } catch (e) {
      console.error("Failed to copy from previous year:", e);
    } finally {
      setCopyLoading(false);
    }
  };

  const addSection = () =>
    setDraftSections((prev) => [
      ...prev,
      { _key: nextKey(), id: undefined, title: "", items: [], _deleted: false },
    ]);

  const updateSectionTitle = (sKey: string, title: string) =>
    setDraftSections((prev) => prev.map((s) => (s._key === sKey ? { ...s, title } : s)));

  const removeSection = (sKey: string) =>
    setDraftSections((prev) => prev.map((s) => (s._key === sKey ? { ...s, _deleted: true } : s)));

  const addItem = (sKey: string) =>
    setDraftSections((prev) =>
      prev.map((s) =>
        s._key !== sKey
          ? s
          : {
              ...s,
              items: [
                ...s.items,
                {
                  _key: nextKey(),
                  id: undefined,
                  label: "",
                  category: BudgetCategory.FOOD,
                  allocatedDollars: "",
                  _deleted: false,
                },
              ],
            }
      )
    );

  const updateItem = (sKey: string, iKey: string, patch: Partial<DraftItem>) =>
    setDraftSections((prev) =>
      prev.map((s) =>
        s._key !== sKey
          ? s
          : { ...s, items: s.items.map((it) => (it._key === iKey ? { ...it, ...patch } : it)) }
      )
    );

  const removeItem = (sKey: string, iKey: string) =>
    setDraftSections((prev) =>
      prev.map((s) =>
        s._key !== sKey
          ? s
          : { ...s, items: s.items.map((it) => (it._key === iKey ? { ...it, _deleted: true } : it)) }
      )
    );

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await Promise.all(
        draftSections
          .filter((s) => s._deleted && s.id)
          .map((s) => deleteBudgetSection(s.id!))
      );

      for (const section of draftSections.filter((s) => !s._deleted)) {
        let sectionId: string;

        if (!section.id) {
          const created = await createBudgetSection({
            clubId,
            title: section.title || "Untitled Section",
            year,
          });
          sectionId = created.id;
        } else {
          await updateBudgetSection(section.id, {
            title: section.title || "Untitled Section",
          });
          sectionId = section.id;
          await Promise.all(
            section.items
              .filter((it) => it._deleted && it.id)
              .map((it) => deleteBudgetItem(it.id!))
          );
        }

        for (const item of section.items.filter((it) => !it._deleted)) {
          const cents = toCents(item.allocatedDollars);
          if (!item.id) {
            await createBudgetItem({
              sectionId,
              label: item.label || "Untitled Item",
              category: item.category,
              allocatedCents: cents,
            });
          } else {
            await updateBudgetItem(item.id, {
              label: item.label || "Untitled Item",
              category: item.category,
              allocatedCents: cents,
            });
          }
        }
      }

      await loadData();
      setSaveSuccess(true);
    } catch (e) {
      console.error("Save failed:", e);
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const activeSections = draftSections.filter((s) => !s._deleted);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-[family-name:var(--font-pt-sans)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Copy/start prompt modal */}
      {showCopyPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4">
            <h2 className="font-semibold text-2xl text-gray-900 font-[family-name:var(--font-public-sans)] mb-2">
              Start {year} Budget
            </h2>
            <p className="text-gray-500 text-sm mb-6 font-[family-name:var(--font-pt-sans)]">
              No entries found for {year}. How would you like to begin?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCopyFromPrevYear}
                disabled={copyLoading}
                className="w-full py-3 rounded-xl bg-[#3172AE] text-white font-semibold font-[family-name:var(--font-public-sans)] hover:bg-[#2860a0] transition-colors disabled:opacity-50"
              >
                {copyLoading ? "Copying…" : `Copy sections from ${year - 1}`}
              </button>
              <button
                onClick={handleStartFresh}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-medium font-[family-name:var(--font-public-sans)] hover:bg-gray-50 transition-colors"
              >
                Start with a blank slate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-[32px] py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#3172AE] font-bold text-sm mb-4 hover:underline font-[family-name:var(--font-pt-sans)]"
          >
            ← Back
          </button>
          <h1 className="text-[32px] font-semibold text-gray-900 leading-tight font-[family-name:var(--font-public-sans)]">
            {year} Budget{clubName ? ` — ${clubName}` : ""}
          </h1>
          <p className="text-gray-500 text-sm font-[family-name:var(--font-pt-sans)] mt-1">
            {isTCU
              ? "Editing the current year budget. Save to apply changes."
              : "Planning next year's budget. Changes are not permanent until you save."}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-8 items-start">

          {/* Left: sections + controls */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-5 mb-6">
              {activeSections.map((section) => {
                const activeItems = section.items.filter((it) => !it._deleted);
                const { food, nonFood } = sectionTotals(section.items);

                return (
                  <div
                    key={section._key}
                    className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                  >
                    {/* Section header */}
                    <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section._key, e.target.value)}
                        placeholder="Section name"
                        className="flex-1 text-xl font-semibold text-gray-900 font-[family-name:var(--font-public-sans)] bg-transparent outline-none border-b border-transparent focus:border-[#3172AE] transition-colors placeholder:font-normal placeholder:text-gray-300"
                      />
                      <button
                        onClick={() => removeSection(section._key)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium font-[family-name:var(--font-pt-sans)] px-2 py-1 rounded hover:bg-red-50 transition-colors whitespace-nowrap"
                      >
                        Remove section
                      </button>
                    </div>

                    {/* Items list */}
                    {activeItems.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        <div className="grid grid-cols-[1fr_148px_148px_32px] gap-3 px-5 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-[family-name:var(--font-pt-sans)]">
                          <span>Item Name</span>
                          <span>Category</span>
                          <span>Amount</span>
                          <span />
                        </div>

                        {activeItems.map((item) => (
                          <div
                            key={item._key}
                            className="grid grid-cols-[1fr_148px_148px_32px] gap-3 items-center px-5 py-3 hover:bg-gray-50/50"
                          >
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) =>
                                updateItem(section._key, item._key, { label: e.target.value })
                              }
                              placeholder="Item name"
                              className="text-sm text-gray-800 border-b border-transparent focus:border-[#3172AE] outline-none bg-transparent font-[family-name:var(--font-pt-sans)] transition-colors w-full placeholder:text-gray-300"
                            />

                            <div className="flex items-center bg-gray-100 rounded-full p-0.5">
                              {([BudgetCategory.FOOD, BudgetCategory.NONFOOD] as const).map((cat) => (
                                <button
                                  key={cat}
                                  onClick={() => updateItem(section._key, item._key, { category: cat })}
                                  className={`flex-1 text-[11px] py-1 rounded-full transition-all font-[family-name:var(--font-pt-sans)] ${
                                    item.category === cat
                                      ? "bg-white text-gray-900 font-bold shadow-sm"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {cat === BudgetCategory.FOOD ? "Food" : "Non-Food"}
                                </button>
                              ))}
                            </div>

                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                $
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.allocatedDollars}
                                onChange={(e) =>
                                  updateItem(section._key, item._key, {
                                    allocatedDollars: e.target.value,
                                  })
                                }
                                placeholder="0.00"
                                className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 text-sm outline-none focus:border-[#3172AE] font-[family-name:var(--font-pt-sans)] bg-white"
                              />
                            </div>

                            <button
                              onClick={() => removeItem(section._key, item._key)}
                              className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none"
                              title="Remove item"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add item */}
                    <div className="px-5 py-3 border-t border-gray-100">
                      <button
                        onClick={() => addItem(section._key)}
                        className="text-sm text-[#3172AE] font-medium hover:underline font-[family-name:var(--font-pt-sans)]"
                      >
                        + Add item
                      </button>
                    </div>

                    {/* Section totals */}
                    <div className="flex items-center gap-8 px-5 py-2.5 bg-gray-50/70 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-[family-name:var(--font-pt-sans)]">
                        Food:{" "}
                        <span className="font-semibold text-gray-800">{formatMoney(food)}</span>
                      </span>
                      <span className="text-xs text-gray-500 font-[family-name:var(--font-pt-sans)]">
                        Non-food:{" "}
                        <span className="font-semibold text-gray-800">{formatMoney(nonFood)}</span>
                      </span>
                      <span className="text-xs text-gray-400 font-[family-name:var(--font-pt-sans)] ml-auto">
                        Section total:{" "}
                        <span className="font-semibold text-gray-700">{formatMoney(food + nonFood)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add section */}
            <button
              onClick={addSection}
              className="mb-8 flex items-center justify-center gap-2 w-full px-5 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#3172AE] hover:text-[#3172AE] transition-colors font-medium font-[family-name:var(--font-pt-sans)] text-sm"
            >
              + Add section
            </button>

            {/* Action bar */}
            <div className="flex items-center gap-4 flex-wrap pb-12">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-8 py-3 bg-[#3172AE] text-white font-semibold rounded-xl hover:bg-[#2860a0] transition-colors font-[family-name:var(--font-public-sans)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>

              {!isTCU && (
                <button
                  onClick={() => alert("Budget submitted to TCU!")}
                  className="px-8 py-3 border border-[#3172AE] text-[#3172AE] font-semibold rounded-xl hover:bg-blue-50 transition-colors font-[family-name:var(--font-public-sans)]"
                >
                  Submit to TCU
                </button>
              )}

              {saveSuccess && (
                <span className="text-green-600 text-sm font-medium font-[family-name:var(--font-pt-sans)]">
                  Changes saved!
                </span>
              )}
              {saveError && (
                <span className="text-red-500 text-sm font-medium font-[family-name:var(--font-pt-sans)]">
                  {saveError}
                </span>
              )}
            </div>
          </div>

          {/* Right: summary panel */}
          <div className="w-72 shrink-0 sticky top-8">
            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#3172AE] font-[family-name:var(--font-public-sans)] text-xl leading-none">
                  Budget Total: {formatMoney(globalSummary.total)}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { label: "Total Food", value: globalSummary.food },
                  { label: "Total Non-Food", value: globalSummary.nonFood },
                  { label: "Total Budget", value: globalSummary.total },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50"
                  >
                    <span className="text-gray-600 font-[family-name:var(--font-pt-sans)] font-normal text-base leading-none whitespace-nowrap">
                      {row.label}
                    </span>
                    <span className="text-gray-800 font-medium font-[family-name:var(--font-pt-sans)]">
                      {formatMoney(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
