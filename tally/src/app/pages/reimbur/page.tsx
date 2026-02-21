"use client";

import { useState } from "react";
import NavBar from "@/app/components/NavBar";

const ALL_MEMBERS = [
  "Ashley Wu", "Jet Yotsuuye", "Kalen Lauring", 
  "Claire Lee", "Kevin Lu", "Justin Paik", 
  "Michelle Chen", "David Park", "Sarah Kim", "James Huang",
  "Emily Tsai", "Brian Lin", "Jessica Cho", "Ryan Wu",
];

const EVENTS = [
  "Spring General Interest Meeting",
  "Fall General Interest Meeting",
  "Culture Night 2026",
  "Spring Banquet",
  "Lunar New Year Celebration",
  "Community Service Day",
  "Game Night",
  "Hiking Trip",
];

const BUDGET_LINES = ["Food", "Decorations", "Bonding", "Supplies", "Transportation", "Marketing", "Other"];

const STEPS = [
  "Choose Club Member",
  "Input Expenses",
  "Upload Itemized Receipt",
  "Choose Budgeted Event",
  "Review and Sign",
];

export default function RequestReimbursement() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [expenses, setExpenses] = useState(
    Array(5).fill(null).map(() => ({ description: "", amount: "" }))
  );
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState({ event: "", line: "" });
  const [signature, setSignature] = useState({ name: "", date: "" });

  const handleExpenseChange = (i, field, value) => {
    setExpenses((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const filledExpenses = expenses.filter((e) => e.description || e.amount);
  const expenseTotal = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const canSubmit = signature.name && signature.date;
  const [submitHover, setSubmitHover] = useState(false);

  return (
    <div style={s.page}>
      <NavBar />

      {/* Content — padded below navbar */}
      <div style={s.content}>
        <div style={s.card}>

          {/* Card header */}
          <div style={s.cardHeader}>
            <div style={{ position: "relative" }}>
            <h2 style={s.cardTitle}>Request a Reimbursement</h2>
            <button style={{ position: "absolute", top: 0, right: 0, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6b7280", lineHeight: 1 }}>✕</button>
          </div>
          </div>

          {/* Steps */}
          {STEPS.map((label, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            const isFuture = i > currentStep;

            return (
              <div
                key={i}
                style={{
                  ...s.stepBlock,
                  borderLeftColor: isActive ? "#3172AE" : "#e5e7eb",
                  opacity: isFuture ? 0.4 : 1,
                }}
              >
                {/* Step label row */}
                <div style={s.stepLabelRow}>
                  <span style={{
                    ...s.stepBubble,
                    background: isActive ? "#3172AE" : isDone ? "#3172AE" : "#e5e7eb",
                    color: isActive || isDone ? "#fff" : "#9ca3af",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    ...s.stepLabelText,
                    color: isActive ? "#111" : isDone ? "#3172AE" : "#9ca3af",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: isActive ? 24 : 16,
                  }}>
                    {label}
                  </span>
                </div>

                {/* Done summary */}
                {isDone && (
                  <div style={s.doneSummary}>
                    {i === 0 && selectedMember && (
                      <p style={s.summaryBlue}>{selectedMember}</p>
                    )}
                    {i === 1 && filledExpenses.length > 0 && (
                      <div>
                        {filledExpenses.map((e, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                            <span style={{ color: "#3172AE", fontWeight: 700 }}>{e.description}</span>
                            <span style={{ color: "#3172AE", fontWeight: 700 }}>
                              {e.amount ? `$${parseFloat(e.amount).toFixed(2)}` : ""}
                            </span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 13, color: "#3172AE", fontWeight: 700, marginTop: 4 }}>
                          ${expenseTotal.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {i === 2 && uploadedFile && (
                      <p style={{ ...s.summaryBlue, fontWeight: 700 }}>📄 {uploadedFile.name}</p>
                    )}
                    {i === 3 && selectedEvent.event && (
                      <p style={s.summaryBlue}>{selectedEvent.event}{selectedEvent.line ? ` — ${selectedEvent.line}` : ""}</p>
                    )}
                  </div>
                )}

                {/* Active step content */}
                {isActive && (
                  <div style={s.stepContent}>
                    {i === 0 && <StepChooseMember selectedMember={selectedMember} onSelect={setSelectedMember} />}
                    {i === 1 && <StepInputExpenses expenses={expenses} onExpenseChange={handleExpenseChange} />}
                    {i === 2 && <StepUploadReceipt uploadedFile={uploadedFile} onUpload={setUploadedFile} />}
                    {i === 3 && <StepChooseEvent selectedEvent={selectedEvent} onSelect={setSelectedEvent} />}
                    {i === 4 && <StepReviewSign signature={signature} setSignature={setSignature} />}

                    {/* Nav buttons inside active step */}
                    <div style={s.navRow}>
                      <div style={{ flex: 1 }} />
                      {currentStep > 0 && (
                        <button style={s.backBtn} onClick={goBack}>← Back</button>
                      )}
                      {currentStep < STEPS.length - 1 ? (
                        <button style={s.nextBtn} onClick={goNext}>Next Step</button>
                      ) : (
                        <button
                          style={{
                            ...s.nextBtn,
                            background: submitHover && canSubmit ? "#3172AE" : "#fff",
                            color: submitHover && canSubmit ? "#fff" : "#3172AE",
                            border: "2px solid #3172AE",
                            opacity: canSubmit ? 1 : 0.5,
                            cursor: canSubmit ? "pointer" : "not-allowed",
                            transition: "background 0.2s, color 0.2s",
                          }}
                          disabled={!canSubmit}
                          onMouseEnter={() => setSubmitHover(true)}
                          onMouseLeave={() => setSubmitHover(false)}
                        >
                          Submit Reimbursement
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}

// choose club member
function StepChooseMember({ selectedMember, onSelect }) {
	const [search, setSearch] = useState("");

  	const filtered = search.trim()
		? ALL_MEMBERS.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
		: [];

	return (
		<div>
		<div style={s.searchRow}>
			<span style={{ fontSize: 12, color: "#9ca3af" }}>🔍</span>
			<input
			style={s.searchInput}
			placeholder="Search members..."
			value={search}
			onChange={(e) => { setSearch(e.target.value); }}
			autoFocus
			/>
		</div>
		{selectedMember && !search && (
			<p style={{ color: "#3172AE", fontWeight: 600, fontSize: 13, margin: "4px 0 0" }}>{selectedMember}</p>
		)}
		{search.trim() && (
			<div style={{ marginTop: 4, border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
			{filtered.length === 0 ? (
				<p style={{ color: "#9ca3af", fontSize: 13, padding: "8px 12px", margin: 0 }}>No members found.</p>
			) : (
				filtered.map((name, ni) => (
				<button
					key={ni}
					onClick={() => { onSelect(name); setSearch(""); }}
					style={{
					display: "block",
					width: "100%",
					background: selectedMember === name ? "#eef4fb" : "none",
					border: "none",
					borderBottom: "1px solid #f3f4f6",
					cursor: "pointer",
					textAlign: "left",
					fontSize: 13,
					padding: "8px 12px",
					color: selectedMember === name ? "#3172AE" : "#111",
					fontWeight: selectedMember === name ? 600 : 400,
					}}
				>
					{name}
				</button>
				))
			)}
			</div>
		)}
		</div>
	);
}

// input expenses
function StepInputExpenses({ expenses, onExpenseChange }) {
	const total = expenses.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

	return (
		<div>
		{expenses.map((row, i) => {
			const isFilled = row.description || row.amount;
			return (
			<div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, background: isFilled ? "#eef4fb" : "transparent", borderRadius: 4, padding: isFilled ? "2px 4px" : 0, transition: "background 0.2s" }}>
				<input
				style={{ ...s.input, flex: 1, borderColor: i === 0 ? "#3172AE" : isFilled ? "#3172AE" : "#d1d5db", background: "transparent" }}
				placeholder={i === 0 ? "Description*" : "Description"}
				value={row.description}
				onChange={(e) => onExpenseChange(i, "description", e.target.value)}
				/>
				<input
				style={{ ...s.input, width: 90, borderColor: isFilled ? "#3172AE" : "#d1d5db", background: "transparent" }}
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
		<div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
			<div style={{ ...s.input, width: 90, background: "#f9fafb", color: "#6b7280", textAlign: "right" }}>
			{total > 0 ? `$${total.toFixed(2)}` : "TOTAL"}
			</div>
		</div>
		</div>
	);
}

	// upload receipt
function StepUploadReceipt({ uploadedFile, onUpload }) {
	return (
		<div>
		{uploadedFile ? (
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eef4fb", border: "1px solid #3172AE", borderRadius: 6, padding: "8px 12px" }}>
			<span style={{ color: "#3172AE", fontSize: 13, fontWeight: 700 }}>📄 {uploadedFile.name}</span>
			<button onClick={() => onUpload(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>✕</button>
			</div>
		) : (
			<label style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, cursor: "pointer", border: "2px dashed #d1d5db", borderRadius: 8 }}>
			<input type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
			<div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#9ca3af" }}>
				↑
			</div>
			</label>
		)}
		</div>
	);
}

// budgeted event
function StepChooseEvent({ selectedEvent, onSelect }) {
	const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center`;
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
		<select
			style={{ ...s.input, appearance: "none", background: `#fff ${chevron}`, paddingRight: 28, cursor: "pointer", color: selectedEvent.event ? "#111" : "#9ca3af" }}
			value={selectedEvent.event}
			onChange={(e) => onSelect((p) => ({ ...p, event: e.target.value }))}
		>
			<option value="" disabled>Select event...</option>
			{EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
		</select>
		<select
			style={{ ...s.input, appearance: "none", background: `#fff ${chevron}`, paddingRight: 28, cursor: "pointer", color: selectedEvent.line ? "#111" : "#9ca3af" }}
			value={selectedEvent.line}
			onChange={(e) => onSelect((p) => ({ ...p, line: e.target.value }))}
		>
			<option value="" disabled>Select budget line...</option>
			{BUDGET_LINES.map((bl) => <option key={bl} value={bl}>{bl}</option>)}
		</select>
		</div>
	);
}

// review and sign
function StepReviewSign({ signature, setSignature }) {
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
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    overflowY: "auto",
  },
  content: {
    paddingTop: 116,
    paddingBottom: 48,
    paddingLeft: 32,
    paddingRight: 32,
  },
  card: {
    background: "transparent",
  },
  cardHeader: {
    marginBottom: 24,
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
    marginBottom: 24,
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
    boxSizing: "border-box",
  },
  navRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: 14,
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
    textAlign: "center",
    flex: 1,
    maxWidth: "50%",
  },
};