"use client";

import { useState } from "react";
import { useEffect } from "react";

// Load Public Sans from Google Fonts
if (typeof document !== "undefined") {
	const link = document.createElement("link");
	link.href = "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600&display=swap";
	link.rel = "stylesheet";
	document.head.appendChild(link);
}

const STEPS = [
	"Choose Club Member",
	"Input Expenses",
	"Upload Itemized Receipt",
	"Choose Budgeted Event",
];

const ALL_MEMBERS = [
	"Ashley Wu", "Jet Yotsuuye", "Kalen Lauring",
	"Claire Lee", "Kevin Lu", "Justin Paik",
	"Michelle Chen", "David Park", "Sarah Kim", "James Huang",
	"Emily Tsai", "Brian Lin", "Jessica Cho", "Ryan Wu",
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

	return (
		<div style={s.page}>
		<style>{`@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600&display=swap');`}</style>
		{/* ── HEADER PLACEHOLDER ── */}
		<div style={s.headerPlaceholder} />

		{/* Top bar */}
		<div style={s.topBar}>
			<h2 style={s.title}>Request a Reimbursement</h2>
		</div>

		{/* 2x2 grid */}
		<div style={s.grid}>
			{STEPS.map((label, i) => {
			const isActive = i === currentStep;
			const isDone = i < currentStep;
			const isFuture = i > currentStep;

			return (
				<div
				key={i}
				style={{
					...s.cell,
					borderColor: isActive ? "#3172AE" : isDone ? "#3172AE" : "#e5e7eb",
					background: isActive ? "#eef4fb" : "#fff",
					opacity: isFuture ? 0.45 : 1,
				}}
				>
				{/* Cell header */}
				<div style={s.cellHeader}>
					<span style={{
					...s.stepBubble,
					background: isActive ? "#3172AE" : "#e5e7eb",
					color: isActive ? "#fff" : "#9ca3af",
					}}>
					{i + 1}
					</span>
					<span style={{
					...s.stepLabel,
					color: isActive ? "#111" : "#9ca3af",
					fontWeight: 500,
					}}>
					{label}
					</span>
				</div>

				{/* Step 1 */}
				{i === 0 && !isActive && selectedMember && (
					<p style={{ color: "#3172AE", fontWeight: 600, fontSize: 14, margin: 0 }}>{selectedMember}</p>
				)}
				{i === 0 && isActive && (
					<StepChooseMember selectedMember={selectedMember} onSelect={setSelectedMember} />
				)}

				{/* Step 2 */}
				{i === 1 && !isActive && filledExpenses.length > 0 && (
					<div>
					{filledExpenses.map((e, idx) => (
						<div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
						<span style={{ color: "#3172AE" }}>{e.description}</span>
						<span style={{ color: "#3172AE", fontWeight: 600 }}>
							{e.amount ? `$${parseFloat(e.amount).toFixed(2)}` : ""}
						</span>
						</div>
					))}
					<div style={{ display: "flex", justifyContent: "flex-end", fontSize: 13, color: "#3172AE", fontWeight: 700, marginTop: 4 }}>
						${expenseTotal.toFixed(2)}
					</div>
					</div>
				)}
				{i === 1 && isActive && (
					<StepInputExpenses expenses={expenses} onExpenseChange={handleExpenseChange} />
				)}

				{/* Step 3 */}
				{i === 2 && !isActive && uploadedFile && (
					<p style={{ color: "#3172AE", fontSize: 13, fontWeight: 500 }}>📄 {uploadedFile.name}</p>
				)}
				{i === 2 && isActive && (
					<StepUploadReceipt uploadedFile={uploadedFile} onUpload={setUploadedFile} />
				)}

				{/* Step 4 */}
				{i === 3 && !isActive && selectedEvent.event && (
					<p style={{ color: "#3172AE", fontWeight: 600, fontSize: 14, margin: 0 }}>{selectedEvent.event}{selectedEvent.line ? ` — ${selectedEvent.line}` : ""}</p>
				)}
				{i === 3 && isActive && (
					<StepChooseEvent selectedEvent={selectedEvent} onSelect={setSelectedEvent} />
				)}
				</div>
			);
			})}
		</div>

		{/* Review and Sign — only shown after all 4 steps done */}
		{currentStep === STEPS.length - 1 && (
			<div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "32px 24px", textAlign: "center" }}>
			<h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 20px", color: "#111" }}>Review and Sign</h3>
			<div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
				<input
				style={{ ...s.input, padding: "10px 14px", fontSize: 14, borderRadius: 6 }}
				placeholder="Organization Signatory Digital Signature"
				value={signature.name}
				onChange={(e) => setSignature(p => ({ ...p, name: e.target.value }))}
				/>
				<input
				style={{ ...s.input, padding: "10px 14px", fontSize: 14, borderRadius: 6 }}
				placeholder="Date"
				type="date"
				value={signature.date}
				onChange={(e) => setSignature(p => ({ ...p, date: e.target.value }))}
				/>
			</div>
			</div>
		)}

		{/* nav / submit */}
		<div style={s.navRow}>
			{currentStep > 0 && (
			<button style={s.backBtn} onClick={goBack}>← Back</button>
			)}
			<div style={{ flex: 1 }} />
			{currentStep < STEPS.length - 1 ? (
			<button style={s.nextBtn} onClick={goNext}>Next Step</button>
			) : (
			<button style={{ ...s.nextBtn, opacity: signature.name && signature.date ? 1 : 0.5, cursor: signature.name && signature.date ? "pointer" : "not-allowed" }} disabled={!signature.name || !signature.date}>Submit Reimbursement</button>
			)}
		</div>
		</div>
	);
}

/* 1: choosing club member */
function StepChooseMember({ selectedMember, onSelect }) {
	const [search, setSearch] = useState("");

	const filtered = ALL_MEMBERS.filter((name) =>
		name.toLowerCase().includes(search.toLowerCase())
	);

	const colSize = Math.ceil(filtered.length / 3);
	const columns = [
		filtered.slice(0, colSize),
		filtered.slice(colSize, colSize * 2),
		filtered.slice(colSize * 2),
	];

	return (
		<div>
		<div style={s.searchRow}>
			<span style={{ fontSize: 12, color: "#9ca3af" }}>🔍</span>
			<input
			style={s.searchInput}
			placeholder="Search members..."
			value={search}
			onChange={(e) => setSearch(e.target.value)}
			/>
		</div>
		<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
			{columns.map((col, ci) => (
			<div key={ci} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
				{col.map((name, ni) => (
				<button
					key={`${ci}-${ni}`}
					onClick={() => onSelect(name)}
					style={{
					background: "none",
					border: "none",
					cursor: "pointer",
					textAlign: "left",
					fontSize: 13,
					padding: "3px 0",
					color: selectedMember === name ? "#3172AE" : "#111",
					fontWeight: selectedMember === name ? 600 : 400,
					}}
				>
					{name}
				</button>
				))}
			</div>
			))}
		</div>
		{filtered.length === 0 && (
			<p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>No members found.</p>
		)}
		</div>
	);
}

/* 2: input expenses */
function StepInputExpenses({ expenses, onExpenseChange }) {
	const total = expenses.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

	return (
		<div>
		{expenses.map((row, i) => (
			<div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
			<input
				style={{
				...s.input,
				flex: 1,
				borderColor: i === 0 ? "#3172AE" : "#d1d5db",
				}}
				placeholder={i === 0 ? "Description*" : "Description"}
				value={row.description}
				onChange={(e) => onExpenseChange(i, "description", e.target.value)}
			/>
			<input
				style={{ ...s.input, width: 90 }}
				placeholder="Amount"
				type="number"
				min="0"
				step="0.01"
				value={row.amount}
				onChange={(e) => onExpenseChange(i, "amount", e.target.value)}
			/>
			</div>
		))}
		<div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
			<div style={{ ...s.input, width: 90, background: "#f9fafb", color: "#6b7280", textAlign: "right" }}>
			{total > 0 ? `$${total.toFixed(2)}` : "TOTAL"}
			</div>
		</div>
		</div>
	);
}

/* upload receipt */
function StepUploadReceipt({ uploadedFile, onUpload }) {
  return (
    <div>
      {uploadedFile ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eef4fb", border: "1px solid #3172AE", borderRadius: 6, padding: "8px 12px" }}>
          <span style={{ color: "#3172AE", fontSize: 13, fontWeight: 500 }}>📄 {uploadedFile.name}</span>
          <button onClick={() => onUpload(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>✕</button>
        </div>
      ) : (
        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, cursor: "pointer" }}>
          <input type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#9ca3af" }}>
            ↑
          </div>
        </label>
      )}
    </div>
  );
}

/* budget event */
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

function StepChooseEvent({ selectedEvent, onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <select
        style={{ ...s.input, appearance: "none", background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center`, paddingRight: 28, cursor: "pointer", color: selectedEvent.event ? "#111" : "#9ca3af" }}
        value={selectedEvent.event}
        onChange={(e) => onSelect(p => ({ ...p, event: e.target.value }))}
      >
        <option value="" disabled>Select event...</option>
        {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
      </select>
      <select
        style={{ ...s.input, appearance: "none", background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center`, paddingRight: 28, cursor: "pointer", color: selectedEvent.line ? "#111" : "#9ca3af" }}
        value={selectedEvent.line}
        onChange={(e) => onSelect(p => ({ ...p, line: e.target.value }))}
      >
        <option value="" disabled>Select budget line...</option>
        {BUDGET_LINES.map((bl) => <option key={bl} value={bl}>{bl}</option>)}
      </select>
    </div>
  );
}

/* style */
const s = {
	page: {
		minHeight: "100vh",
		background: "#f9fafb",
		display: "flex",
		flexDirection: "column",
	},
	headerPlaceholder: {
		height: 48,
		background: "#3172AE",
	},
	topBar: {
		background: "#fff",
		borderBottom: "1px solid #e5e7eb",
		padding: "16px 24px 12px",
	},
	title: {
		fontSize: 36,
		fontWeight: 600,
		fontFamily: "'Public Sans', sans-serif",
		margin: 0,
		color: "#111",
		textAlign: "center",
		lineHeight: 1,
		letterSpacing: 0,
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gridTemplateRows: "1fr 1fr",
		gap: 16,
		padding: 24,
		flex: 1,
	},
	cell: {
		border: "1.5px solid",
		borderRadius: 8,
		padding: 16,
		background: "#fff",
		transition: "border-color 0.2s, background 0.2s, opacity 0.2s",
		overflow: "auto",
	},
	cellHeader: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
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
	stepLabel: {
		fontSize: 24,
		fontWeight: 500,
		fontFamily: "'Public Sans', sans-serif",
		lineHeight: 1,
		letterSpacing: 0,
		transition: "color 0.2s",
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
	},
	navRow: {
		display: "flex",
		alignItems: "center",
		padding: "14px 24px",
		borderTop: "1px solid #e5e7eb",
		background: "#fff",
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
		borderRadius: 6,
		padding: "8px 22px",
		cursor: "pointer",
		fontSize: 14,
		fontWeight: 500,
	},
};