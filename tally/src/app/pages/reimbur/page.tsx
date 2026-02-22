"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/app/components/NavBar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import type { User, BudgetSection, BudgetItem } from "@prisma/client";
import type { ClubMembershipWithUser } from "@/types/clubMembership";
import { useTreasurerStore } from "@/store/treasurerStore";

// import { getTreasurerClubMembers } from "@/lib/api/clubMembership";
import { getBudgetSectionsByClubId } from "@/lib/api/budgetSection";
import { getBudgetItemsBySectionId } from "@/lib/api/budgetItem";

import { fillReimbursementPDF } from "@/lib/fillReimbursementPDF";
import { getClubById } from "@/lib/api/club";

const STEPS = [
  "Choose Club Member",
  "Input Expenses",
  "Upload Itemized Receipt",
  "Choose Budgeted Event",
  "Review and Sign",
];

export default function RequestReimbursement() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);

  // step 1
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // treasurer club + budget data
  const [budgetSections, setBudgetSections] = useState<BudgetSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // cache: sectionId -> items
  const [budgetItemsBySection, setBudgetItemsBySection] = useState<Record<string, BudgetItem[]>>(
    {}
  );

  const treasurerClubId = useTreasurerStore((s) => s.treasurerClubId);
  const memberships = useTreasurerStore((s) => s.memberships);
  const loadingTreasurer = useTreasurerStore((s) => s.loading);

  // step 2/3/5
  const [expenses, setExpenses] = useState(
    Array(5)
      .fill(null)
      .map(() => ({ description: "", amount: "" }))
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [signature, setSignature] = useState({ name: "", date: "" });

  

  // ---------- derived lists ----------
  const clubMembers: User[] = useMemo(() => {
    const map = new Map<string, User>();
    for (const m of memberships) {
      if (m.user) map.set(m.user.id, m.user);
    }
    return Array.from(map.values()).sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );
  }, [memberships]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return clubMembers.find((u) => u.id === selectedMemberId) ?? null;
  }, [selectedMemberId, clubMembers]);

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return budgetSections.find((s) => s.id === selectedSectionId) ?? null;
  }, [selectedSectionId, budgetSections]);

  const budgetItems: BudgetItem[] = useMemo(() => {
    if (!selectedSectionId) return [];
    return budgetItemsBySection[selectedSectionId] ?? [];
  }, [selectedSectionId, budgetItemsBySection]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return budgetItems.find((bi) => bi.id === selectedItemId) ?? null;
  }, [selectedItemId, budgetItems]);


  // ---------- fetch budget sections ----------
  useEffect(() => {
    if (!treasurerClubId) return;

    let cancelled = false;

    (async () => {
      try {
        const sections = await getBudgetSectionsByClubId(treasurerClubId);
        if (cancelled) return;
        setBudgetSections(sections);
      } catch (e) {
        console.error("Failed to fetch budget sections:", e);
        if (cancelled) return;
        setBudgetSections([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [treasurerClubId]);

  // ---------- fetch budget items for selected section (cached) ----------
  useEffect(() => {
    if (!selectedSectionId) return;
    if (budgetItemsBySection[selectedSectionId]) return;

    let cancelled = false;

    (async () => {
      try {
        const items = await getBudgetItemsBySectionId(selectedSectionId);
        if (cancelled) return;

        setBudgetItemsBySection((prev) => ({
          ...prev,
          [selectedSectionId]: items,
        }));
      } catch (e) {
        console.error("Failed to fetch budget items:", e);
        if (cancelled) return;

        setBudgetItemsBySection((prev) => ({
          ...prev,
          [selectedSectionId]: [],
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSectionId, budgetItemsBySection]);

  // ---------- handlers ----------
  const handleExpenseChange = (i: number, field: "description" | "amount", value: string) => {
    setExpenses((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const filledExpenses = expenses.filter((e) => e.description || e.amount);
  const expenseTotal = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const canSubmit = signature.name && signature.date;
  const [submitHover, setSubmitHover] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!treasurerClubId) return;
    if (!selectedMemberId) return;
    if (!selectedItemId) return;
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const club = await getClubById(treasurerClubId);
      const amountCents = Math.round(expenseTotal * 100);

      // Generate PDF
      const pdfBytes = await fillReimbursementPDF({
        payTo: `${selectedMember?.firstName} ${selectedMember?.lastName}`,
        studentId: selectedMember?.studentId ?? "",
        email: selectedMember?.email ?? "",
        phone: selectedMember?.phoneNumber ?? "",
        permAddress: selectedMember?.permAddress1 ?? "",
        permCityStateZip: [selectedMember?.permCity, selectedMember?.permState, selectedMember?.permZip].filter(Boolean).join(", "),
        localAddress: selectedMember?.tempAddress1 ?? "",
        localCityStateZip: [selectedMember?.tempCity, selectedMember?.tempState, selectedMember?.tempZip].filter(Boolean).join(", "),
        amount: `$${expenseTotal.toFixed(2)}`,
        expenses: filledExpenses,
        date: signature.date,
        club: club.name,
        signature: signature.name,
        eventBudgetLine: `${selectedSection?.title} — ${selectedItem?.label}`,
      });

      // Build FormData for the API
      const formData = new FormData();
      formData.append("clubId", treasurerClubId);
      formData.append("clubName", club.name);
      formData.append("payeeUserId", selectedMemberId);
      formData.append("budgetItemId", selectedItemId);
      formData.append("amountCents", String(amountCents));
      formData.append(
        "description",
        JSON.stringify({
          expenses: filledExpenses,
          signature,
          eventBudgetLine: `${selectedSection?.title} — ${selectedItem?.label}`,
        })
      );

      if (uploadedFile) {
        formData.append("receipt", uploadedFile);
      }

      // this code takes the pdf bytes and puts them in a blob that we append
      // to the form data for upload to supabase
      const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      formData.append("generatedPdf", pdfBlob, "reimbursement-form.pdf");

      const res = await fetch("/api/reimbursements", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit");
      }

      // Download generated PDF for the user
      const downloadBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(downloadBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `reimbursement-${selectedMember?.lastName ?? "form"}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      router.push("/");
    } catch (e: any) {
      console.error(e);
      setSubmitError(e?.message ?? "Failed to submit reimbursement");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const filledExpenses = expenses.filter((e) => e.description || e.amount);
  const expenseTotal = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const canSubmit = signature.name && signature.date;
  const [submitHover, setSubmitHover] = useState(false);

  if (loadingTreasurer) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!treasurerClubId) {
    return (
      <div className="p-6 text-red-500">
        You do not have treasurer access.
      </div>
    );
  }


  return (
    <div style={s.shell}>
      <NavBar />

      <div style={s.scroll}>
        <div style={s.content}>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div style={{ position: "relative" }}>
                <h2 style={s.cardTitle}>Request a Reimbursement</h2>
                <button
                  onClick={() => router.push("/")}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 36,
                    height: 36,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 24,
                    color: "#000",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {STEPS.map((label, i) => {
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              const isFuture = i > currentStep;

              return (
                <div key={label}>
                  {isActive && i > 0 && (
                    <div
                      style={{
                        borderTop: "1px solid #EAEAEA",
                        marginBottom: 16,
                        marginLeft: 19,
                      }}
                    />
                  )}

                  <div
                    style={{
                      ...s.stepBlock,
                      borderLeftColor: isActive ? "#3172AE" : "#e5e7eb",
                      opacity: isFuture ? 0.4 : 1,
                      marginBottom: isActive ? 0 : 32,
                    }}
                  >
                    <div style={s.stepLabelRow}>
                      <span
                        style={{
                          ...s.stepBubble,
                          background: isActive ? "#3172AE" : isDone ? "#8D8B8B" : "#e5e7eb",
                          color: isActive || isDone ? "#fff" : "#9ca3af",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        style={{
                          ...s.stepLabelText,
                          color: isActive ? "#111" : isDone ? "#8D8B8B" : "#9ca3af",
                          fontWeight: isActive ? 600 : 500,
                          fontSize: isActive ? 24 : 16,
                        }}
                      >
                        {label}
                      </span>
                    </div>

                    {isDone && (
                      <div style={s.doneSummary}>
                        {i === 0 && selectedMember && (
                          <p style={s.summaryBlue}>
                            {selectedMember.firstName} {selectedMember.lastName}
                          </p>
                        )}

                        {i === 1 && filledExpenses.length > 0 && (
                          <div>
                            {filledExpenses.map((e, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 13,
                                  marginBottom: 3,
                                }}
                              >
                                <span style={{ color: "#3172AE", fontWeight: 700 }}>
                                  {e.description}
                                </span>
                                <span style={{ color: "#3172AE", fontWeight: 700 }}>
                                  {e.amount ? `$${parseFloat(e.amount).toFixed(2)}` : ""}
                                </span>
                              </div>
                            ))}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                fontSize: 13,
                                color: "#3172AE",
                                fontWeight: 700,
                                marginTop: 4,
                              }}
                            >
                              ${expenseTotal.toFixed(2)}
                            </div>
                          </div>
                        )}

                        {i === 2 && uploadedFile && (
                          <p style={{ ...s.summaryBlue, fontWeight: 700 }}>
                            📄 {uploadedFile.name}
                          </p>
                        )}

                        {i === 3 && selectedSection && selectedItem && (
                          <p style={s.summaryBlue}>
                            {selectedSection.title} — {selectedItem.label}
                          </p>
                        )}
                      </div>
                    )}

                    {isActive && (
                      <div style={s.stepContent}>
                        {i === 0 && (
                          <StepChooseMember
                            members={clubMembers}
                            selectedMemberId={selectedMemberId}
                            onSelectMemberId={setSelectedMemberId}
                          />
                        )}

                        {i === 1 && (
                          <StepInputExpenses
                            expenses={expenses}
                            onExpenseChange={handleExpenseChange}
                          />
                        )}

                        {i === 2 && (
                          <StepUploadReceipt
                            uploadedFile={uploadedFile}
                            onUpload={setUploadedFile}
                          />
                        )}

                        {i === 3 && (
                          <StepChooseBudget
                            budgetSections={budgetSections}
                            selectedSectionId={selectedSectionId}
                            setSelectedSectionId={(id) => {
                              setSelectedSectionId(id);
                              setSelectedItemId(null);
                            }}
                            budgetItems={budgetItems}
                            selectedItemId={selectedItemId}
                            setSelectedItemId={setSelectedItemId}
                          />
                        )}

                        {i === 4 && (
                          <StepReviewSign signature={signature} setSignature={setSignature} />
                        )}

                        <div style={s.navRow}>
                          <div style={{ flex: 1 }} />
                          {currentStep > 0 && (
                            <button style={s.backBtn} onClick={goBack}>
                              ← Back
                            </button>
                          )}

                          {currentStep < STEPS.length - 1 ? (
                            <button style={s.nextBtn} onClick={goNext}>
                              Next Step
                            </button>
                          ) : (
                            <button
                              style={{
                                ...s.nextBtn,
                                opacity: canSubmit ? 1 : 0.5,
                                cursor: canSubmit ? "pointer" : "not-allowed",
                                background:
                                  submitHover && canSubmit ? "#fff" : "#3172AE",
                                color:
                                  submitHover && canSubmit ? "#3172AE" : "#fff",
                              }}
                              disabled={!canSubmit || submitting}
                              onClick={handleSubmit}
                              onMouseEnter={() => setSubmitHover(true)}
                              onMouseLeave={() => setSubmitHover(false)}
                            >
                              {submitting ? "Submitting..." : "Submit Reimbursement"}
                            </button>
                          )}
                        </div>

                        {submitError && (
                          <p style={{ color: "crimson", marginTop: 8 }}>{submitError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {isActive && i < STEPS.length - 1 && (
                    <div
                      style={{
                        borderTop: "1px solid #EAEAEA",
                        marginTop: 16,
                        marginBottom: 16,
                        marginLeft: 19,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Step 1: choose member (dynamic) -----
function StepChooseMember({
  members,
  selectedMemberId,
  onSelectMemberId,
}: {
  members: User[];
  selectedMemberId: string | null;
  onSelectMemberId: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const selectedUser = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find((u) => u.id === selectedMemberId) ?? null;
  }, [selectedMemberId, members]);

  const filtered = search.trim()
    ? members.filter((u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div>
      <div style={s.searchRow}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {selectedUser && !search && (
        <p style={{ color: "#3172AE", fontWeight: 600, fontSize: 13, margin: "4px 0 0" }}>
          {selectedUser.firstName} {selectedUser.lastName}
        </p>
      )}

      {search.trim() && (
        <div
          style={{
            marginTop: 4,
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {filtered.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, padding: "8px 12px", margin: 0 }}>
              No members found.
            </p>
          ) : (
            filtered.map((u) => {
              const name = `${u.firstName} ${u.lastName}`;
              const isSelected = selectedMemberId === u.id;

              return (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectMemberId(u.id);
                    setSearch("");
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    background: isSelected ? "#eef4fb" : "none",
                    border: "none",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    padding: "8px 12px",
                    color: isSelected ? "#3172AE" : "#111",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {name}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ----- Step 2: expenses -----
function StepInputExpenses({
  expenses,
  onExpenseChange,
}: {
  expenses: { description: string; amount: string }[];
  onExpenseChange: (i: number, field: "description" | "amount", value: string) => void;
}) {
  const total = expenses.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  return (
    <div>
      {expenses.map((row, i) => {
        const isFilled = row.description || row.amount;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
              background: isFilled ? "#eef4fb" : "transparent",
              borderRadius: 4,
              padding: isFilled ? "2px 4px" : 0,
              transition: "background 0.2s",
            }}
          >
            <input
              style={{
                ...s.input,
                flex: 1,
                borderColor: i === 0 ? "#3172AE" : isFilled ? "#3172AE" : "#d1d5db",
                background: "transparent",
              }}
              placeholder={i === 0 ? "Description*" : "Description"}
              value={row.description}
              onChange={(e) => onExpenseChange(i, "description", e.target.value)}
            />
            <input
              style={{
                ...s.input,
                width: 90,
                borderColor: isFilled ? "#3172AE" : "#d1d5db",
                background: "transparent",
              }}
              placeholder="Amount"
              type="number"
              min="0"
              step="0.01"
              value={row.amount}
              onChange={(e) => onExpenseChange(i, "amount", e.target.value)}
            />
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "baseline",
          gap: 12,
          marginTop: 16,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: "var(--font-pt-sans)",
            letterSpacing: "0.15em",
            color: "#111",
            fontWeight: 500,
          }}
        >
          TOTAL:
        </span>

        <span
          style={{
            fontSize: 20,
            fontFamily: "var(--font-public-sans)",
            fontWeight: 700,
            color: "#111",
            lineHeight: 1,
          }}
        >
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ----- Step 3: upload -----
function StepUploadReceipt({
  uploadedFile,
  onUpload,
}: {
  uploadedFile: File | null;
  onUpload: (f: File | null) => void;
}) {
  return (
    <div>
      {uploadedFile ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#eef4fb",
            border: "1px solid #3172AE",
            borderRadius: 6,
            padding: "8px 12px",
          }}
        >
          <span style={{ color: "#3172AE", fontSize: 13, fontWeight: 700 }}>
            📄 {uploadedFile.name}
          </span>
          <button
            onClick={() => onUpload(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 80,
            cursor: "pointer",
            border: "2px dashed #d1d5db",
            borderRadius: 8,
          }}
        >
          <input
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid #d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#9ca3af",
            }}
          >
            ↑
          </div>
        </label>
      )}
    </div>
  );
}

// ----- Step 4: budget section + line (dynamic) -----
function StepChooseBudget({
  budgetSections,
  selectedSectionId,
  setSelectedSectionId,
  budgetItems,
  selectedItemId,
  setSelectedItemId,
}: {
  budgetSections: BudgetSection[];
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  budgetItems: BudgetItem[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}) {
  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <select
        style={{
          ...s.input,
          appearance: "none",
          background: `#fff ${chevron}`,
          paddingRight: 28,
          cursor: "pointer",
          color: selectedSectionId ? "#111" : "#9ca3af",
          fontFamily: "var(--font-public-sans)",
        }}
        value={selectedSectionId ?? ""}
        onChange={(e) => setSelectedSectionId(e.target.value || null)}
      >
        <option value="" disabled>
          Select budget section...
        </option>
        {budgetSections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.title}
          </option>
        ))}
      </select>

      <select
        style={{
          ...s.input,
          appearance: "none",
          background: `#fff ${chevron}`,
          paddingRight: 28,
          cursor: selectedSectionId ? "pointer" : "not-allowed",
          color: selectedItemId ? "#111" : "#9ca3af",
          fontFamily: "var(--font-public-sans)",
        }}
        value={selectedItemId ?? ""}
        onChange={(e) => setSelectedItemId(e.target.value || null)}
        disabled={!selectedSectionId}
      >
        <option value="" disabled>
          {selectedSectionId ? "Select budget line..." : "Select section first"}
        </option>
        {budgetItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ----- Step 5: review/sign -----
function StepReviewSign({
  signature,
  setSignature,
}: {
  signature: { name: string; date: string };
  setSignature: React.Dispatch<React.SetStateAction<{ name: string; date: string }>>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        style={{ ...s.input, padding: "10px 14px", fontSize: 14 }}
        placeholder="Organization Signatory Digital Signature"
        value={signature.name}
        onChange={(e) => setSignature((p) => ({ ...p, name: e.target.value }))}
      />
      <input
        style={{ ...s.input, padding: "10px 14px", fontSize: 14 }}
        placeholder="Date"
        type="date"
        value={signature.date}
        onChange={(e) => setSignature((p) => ({ ...p, date: e.target.value }))}
      />
    </div>
  );
}

/* style */
const s = {
  shell: {
    height: "100vh",
    background: "#f9fafb",
    display: "flex",
    flexDirection: "column" as const,
  },
  scroll: {
    flex: 1,
    overflowY: "auto" as const,
    WebkitOverflowScrolling: "touch" as const,
  },
  content: {
    paddingTop: 130,
    paddingBottom: 48,
    paddingLeft: 32,
    paddingRight: 32,
  },
  card: {
    background: "transparent",
  },
  cardHeader: {
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 36,
    fontWeight: 600,
    fontFamily: "var(--font-public-sans)",
    lineHeight: "100%",
    letterSpacing: 0,
    margin: 0,
    color: "#111",
  },
  stepBlock: {
    borderLeft: "3px solid",
    paddingLeft: 16,
    marginBottom: 32,
    transition: "border-color 0.2s, opacity 0.2s",
  },
  stepLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  stepBubble: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepLabelText: {
    fontFamily: "var(--font-public-sans)",
    fontWeight: 500,
    fontSize: 16,
    lineHeight: "100%",
    letterSpacing: 0,
    transition: "color 0.2s, font-size 0.2s",
  },
  doneSummary: {
    paddingLeft: 28,
    marginBottom: 4,
    maxWidth: "50%",
  },
  summaryBlue: {
    color: "#3172AE",
    fontWeight: 600,
    fontSize: 14,
    margin: 0,
  },
  stepContent: {
    paddingLeft: 28,
    paddingTop: 4,
    maxWidth: "50%",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderBottom: "1.5px solid #111",
    paddingBottom: 4,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 13,
    background: "transparent",
    color: "#111",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 13,
    outline: "none",
    color: "#111",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  navRow: {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 30,
    marginTop: 20,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "black",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "var(--font-pt-sans)",
  },
  nextBtn: {
    background: "#3172AE",
    color: "#fff",
    border: "none",
    borderRadius: 50,
    padding: "16px 0",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "var(--font-pt-sans)",
    lineHeight: "100%",
    letterSpacing: "0.05em",
    textAlign: "center" as const,
    flex: 1,
    maxWidth: "50%",
  },
};