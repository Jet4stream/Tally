"use client";

import { useMemo, useState } from "react";

// Axios helpers (adjust paths if yours differ)
import { createClub, getAllClubs } from "@/lib/api/club";
import {
  createClubMembership,
  getAllClubMemberships,
} from "@/lib/api/clubMembership";
import {
  createClubInvite,
  getAllClubInvites,
} from "@/lib/api/clubInvite";
import {
  createBudgetSection,
  getAllBudgetSections,
} from "@/lib/api/budgetSection";
import { createBudgetItem, getAllBudgetItems } from "@/lib/api/budgetItem";
import {
  createReimbursement,
  getAllReimbursements,
} from "@/lib/api/reimbursement";

type LogEntry = {
  ts: string;
  label: string;
  data?: any;
  error?: string;
};

function nowTs() {
  return new Date().toLocaleTimeString();
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "px-3 py-2 border border-gray-300 rounded-lg",
        "focus:outline-none focus:ring-2 focus:ring-black",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "px-3 py-2 border border-gray-300 rounded-lg",
        "focus:outline-none focus:ring-2 focus:ring-black",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Button({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => Promise<void> | void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export default function BackendTestPage() {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");

  // ====== CLUB ======
  const [clubName, setClubName] = useState("Test Club");

  // ====== CLUB MEMBERSHIP ======
  const [membershipClubId, setMembershipClubId] = useState("");
  const [membershipUserId, setMembershipUserId] = useState(""); // Clerk userId
  const [membershipRole, setMembershipRole] = useState<"TREASURER" | "MEMBER">(
    "MEMBER"
  );

  // ====== CLUB INVITE ======
  const [inviteClubId, setInviteClubId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"TREASURER" | "MEMBER">("MEMBER");
  const [inviteExpiresAt, setInviteExpiresAt] = useState(() => {
    // 7 days from now
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16); // for datetime-local
  });

  // ====== BUDGET SECTION ======
  const [sectionClubId, setSectionClubId] = useState("");
  const [sectionTitle, setSectionTitle] = useState("Food");
  const [sectionDefinition, setSectionDefinition] = useState("Food-related costs");

  // ====== BUDGET ITEM ======
  const [itemSectionId, setItemSectionId] = useState("");
  const [itemLabel, setItemLabel] = useState("Pizza");
  const [itemCategory, setItemCategory] = useState<"FOOD" | "NONFOOD">("FOOD");
  const [itemAllocatedCents, setItemAllocatedCents] = useState("5000");
  const [itemSpentCents, setItemSpentCents] = useState("0");
  const [itemNotes, setItemNotes] = useState("");

  // ====== REIMBURSEMENT ======
  const [reimbClubId, setReimbClubId] = useState("");
  const [reimbClubName, setReimbClubName] = useState("Test Club");
  const [reimbCreatedUserId, setReimbCreatedUserId] = useState(""); // Clerk userId
  const [reimbPayeeUserId, setReimbPayeeUserId] = useState(""); // Clerk userId
  const [reimbBudgetItemId, setReimbBudgetItemId] = useState(""); // optional
  const [reimbAmountCents, setReimbAmountCents] = useState("1234");
  const [reimbDescription, setReimbDescription] = useState("Test reimbursement");
  const [reimbReceiptUrl, setReimbReceiptUrl] = useState("");
  const [reimbFormUrl, setReimbFormUrl] = useState("");
  const [reimbPacketUrl, setReimbPacketUrl] = useState("");

  // Convenience: a “suggested ids” area you can copy/paste from log output.
  const lastCreatedIds = useMemo(() => {
    const ids: Record<string, string> = {};
    for (const entry of log) {
      const d = entry.data;
      if (!d) continue;
      if (d?.id && typeof d.id === "string") {
        // heuristics
        if (d?.name) ids["clubId"] = d.id;
        if (d?.clubId && d?.userId) ids["membershipId"] = d.id;
        if (d?.userEmail && d?.expiresAt) ids["inviteId"] = d.id;
        if (d?.title && d?.clubId) ids["sectionId"] = d.id;
        if (d?.sectionId && d?.label) ids["budgetItemId"] = d.id;
        if (d?.amountCents != null && d?.clubId) ids["reimbursementId"] = d.id;
      }
    }
    return ids;
  }, [log]);

  const pushLog = (entry: Omit<LogEntry, "ts">) => {
    setLog((prev) => [{ ts: nowTs(), ...entry }, ...prev].slice(0, 50));
  };

  const run = async (label: string, fn: () => Promise<any>) => {
    setError("");
    setBusy(true);
    try {
      const data = await fn();
      pushLog({ label, data });
      return data;
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Request failed (see console)";
      console.error(label, e);
      setError(msg);
      pushLog({ label, error: msg });
      throw e;
    } finally {
      setBusy(false);
    }
  };

  // ================== Actions ==================

  const createClubAction = async () => {
    const club = await run("CREATE club", () => createClub({ name: clubName }));
    // auto-fill downstream fields
    setMembershipClubId(club.id);
    setInviteClubId(club.id);
    setSectionClubId(club.id);
    setReimbClubId(club.id);
    setReimbClubName(club.name);
  };

  const listClubsAction = async () => {
    await run("LIST clubs", () => getAllClubs());
  };

  const createMembershipAction = async () => {
    await run("CREATE club-membership", () =>
      createClubMembership({
        clubId: membershipClubId,
        userId: membershipUserId,
        role: membershipRole,
      })
    );
  };

  const listMembershipsAction = async () => {
    await run("LIST club-memberships", () => getAllClubMemberships());
  };

  const createInviteAction = async () => {
    // datetime-local => Date
    const expires = new Date(inviteExpiresAt);
    await run("CREATE club-invitation", () =>
      createClubInvite({
        clubId: inviteClubId,
        userEmail: inviteEmail,
        role: inviteRole,
        expiresAt: expires,
      })
    );
  };

  const listInvitesAction = async () => {
    await run("LIST club-invitations", () => getAllClubInvites());
  };

  const createSectionAction = async () => {
    const section = await run("CREATE budget-section", () =>
      createBudgetSection({
        clubId: sectionClubId,
        title: sectionTitle,
        definition: sectionDefinition,
      })
    );
    setItemSectionId(section.id);
  };

  const listSectionsAction = async () => {
    await run("LIST budget-sections", () => getAllBudgetSections());
  };

  const createItemAction = async () => {
    const allocated = Number(itemAllocatedCents);
    const spent = Number(itemSpentCents);

    await run("CREATE budget-item", () =>
      createBudgetItem({
        sectionId: itemSectionId,
        label: itemLabel,
        category: itemCategory,
        allocatedCents: isNaN(allocated) ? 0 : allocated,
        spentCents: isNaN(spent) ? 0 : spent,
        notes: itemNotes || null,
      })
    );
  };

  const listItemsAction = async () => {
    await run("LIST budget-items", () => getAllBudgetItems());
  };

  const createReimbursementAction = async () => {
    const amount = Number(reimbAmountCents);

    await run("CREATE reimbursement", () =>
      createReimbursement({
        clubId: reimbClubId,
        clubName: reimbClubName,
        createdUserId: reimbCreatedUserId,
        payeeUserId: reimbPayeeUserId,

        budgetItemId: reimbBudgetItemId || null,

        amountCents: isNaN(amount) ? 0 : amount,
        description: reimbDescription,

        receiptFileUrl: reimbReceiptUrl || null,
        generatedFormPdfUrl: reimbFormUrl || null,
        packetPdfUrl: reimbPacketUrl || null,
      } as any) // if your createReimbursement typing is strict, remove `as any` and align its type
    );
  };

  const listReimbursementsAction = async () => {
    await run("LIST reimbursements", () => getAllReimbursements());
  };

  // ================== UI ==================
  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <main className="h-full overflow-y-auto flex justify-center px-4 py-10">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">Backend Test Page</h1>
            <p className="text-gray-600">
              Create + list your Prisma-backed resources via axios helpers.
            </p>
          </div>

          <div className="text-xs text-gray-500">
            Busy: <span className="font-mono">{String(busy)}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Quick copy IDs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold">Last created IDs (auto-detected)</div>
          <div className="mt-2 grid gap-1 text-xs font-mono text-gray-700">
            {Object.keys(lastCreatedIds).length === 0 ? (
              <div className="text-gray-500 font-sans">
                Create something and IDs will show up here.
              </div>
            ) : (
              Object.entries(lastCreatedIds).map(([k, v]) => (
                <div key={k}>
                  {k}: <span className="select-all">{v}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* CLUB */}
          <Card title="Club">
            <Input
              placeholder="Club name"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button disabled={busy} onClick={createClubAction}>
                Create Club
              </Button>
              <Button disabled={busy} onClick={listClubsAction}>
                List Clubs
              </Button>
            </div>
          </Card>

          {/* CLUB MEMBERSHIP */}
          <Card title="Club Membership">
            <Input
              placeholder="clubId"
              value={membershipClubId}
              onChange={(e) => setMembershipClubId(e.target.value)}
            />
            <Input
              placeholder="userId (Clerk)"
              value={membershipUserId}
              onChange={(e) => setMembershipUserId(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg"
                value={membershipRole}
                onChange={(e) => setMembershipRole(e.target.value as any)}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="TREASURER">TREASURER</option>
              </select>

              <Button disabled={busy} onClick={createMembershipAction}>
                Create Membership
              </Button>
              <Button disabled={busy} onClick={listMembershipsAction}>
                List
              </Button>
            </div>
          </Card>

          {/* CLUB INVITE */}
          <Card title="Club Invitation">
            <Input
              placeholder="clubId"
              value={inviteClubId}
              onChange={(e) => setInviteClubId(e.target.value)}
            />
            <Input
              placeholder="userEmail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoCapitalize="none"
            />

            <div className="grid gap-2">
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="TREASURER">TREASURER</option>
                </select>

                <Input
                  type="datetime-local"
                  value={inviteExpiresAt}
                  onChange={(e) => setInviteExpiresAt(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button disabled={busy} onClick={createInviteAction}>
                  Create Invite
                </Button>
                <Button disabled={busy} onClick={listInvitesAction}>
                  List Invites
                </Button>
              </div>
            </div>
          </Card>

          {/* BUDGET SECTION */}
          <Card title="Budget Section">
            <Input
              placeholder="clubId"
              value={sectionClubId}
              onChange={(e) => setSectionClubId(e.target.value)}
            />
            <Input
              placeholder="title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />
            <Input
              placeholder="definition"
              value={sectionDefinition}
              onChange={(e) => setSectionDefinition(e.target.value)}
            />
            <div className="flex gap-2">
              <Button disabled={busy} onClick={createSectionAction}>
                Create Section
              </Button>
              <Button disabled={busy} onClick={listSectionsAction}>
                List Sections
              </Button>
            </div>
          </Card>

          {/* BUDGET ITEM */}
          <Card title="Budget Item">
            <Input
              placeholder="sectionId"
              value={itemSectionId}
              onChange={(e) => setItemSectionId(e.target.value)}
            />
            <Input
              placeholder="label"
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg"
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value as any)}
              >
                <option value="FOOD">FOOD</option>
                <option value="NONFOOD">NONFOOD</option>
              </select>

              <Input
                placeholder="allocatedCents"
                value={itemAllocatedCents}
                onChange={(e) => setItemAllocatedCents(e.target.value)}
              />
              <Input
                placeholder="spentCents"
                value={itemSpentCents}
                onChange={(e) => setItemSpentCents(e.target.value)}
              />
            </div>
            <Textarea
              rows={2}
              placeholder="notes"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button disabled={busy} onClick={createItemAction}>
                Create Item
              </Button>
              <Button disabled={busy} onClick={listItemsAction}>
                List Items
              </Button>
            </div>
          </Card>

          {/* REIMBURSEMENT */}
          <Card title="Reimbursement">
            <Input
              placeholder="clubId"
              value={reimbClubId}
              onChange={(e) => setReimbClubId(e.target.value)}
            />
            <Input
              placeholder="clubName"
              value={reimbClubName}
              onChange={(e) => setReimbClubName(e.target.value)}
            />
            <Input
              placeholder="createdUserId (Clerk)"
              value={reimbCreatedUserId}
              onChange={(e) => setReimbCreatedUserId(e.target.value)}
            />
            <Input
              placeholder="payeeUserId (Clerk)"
              value={reimbPayeeUserId}
              onChange={(e) => setReimbPayeeUserId(e.target.value)}
            />

            <Input
              placeholder="budgetItemId (optional)"
              value={reimbBudgetItemId}
              onChange={(e) => setReimbBudgetItemId(e.target.value)}
            />

            <Input
              placeholder="amountCents"
              value={reimbAmountCents}
              onChange={(e) => setReimbAmountCents(e.target.value)}
            />

            <Textarea
              rows={2}
              placeholder="description"
              value={reimbDescription}
              onChange={(e) => setReimbDescription(e.target.value)}
            />

            <Input
              placeholder="receiptFileUrl (optional)"
              value={reimbReceiptUrl}
              onChange={(e) => setReimbReceiptUrl(e.target.value)}
            />
            <Input
              placeholder="generatedFormPdfUrl (optional)"
              value={reimbFormUrl}
              onChange={(e) => setReimbFormUrl(e.target.value)}
            />
            <Input
              placeholder="packetPdfUrl (optional)"
              value={reimbPacketUrl}
              onChange={(e) => setReimbPacketUrl(e.target.value)}
            />

            <div className="flex gap-2">
              <Button disabled={busy} onClick={createReimbursementAction}>
                Create Reimbursement
              </Button>
              <Button disabled={busy} onClick={listReimbursementsAction}>
                List Reimbursements
              </Button>
            </div>
          </Card>
        </div>

        
      </main>
    </div>
  );
}