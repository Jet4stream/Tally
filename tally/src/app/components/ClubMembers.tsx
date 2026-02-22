"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import InviteLogo from "../assests/Invite.svg";
import { createClubInvite } from "@/lib/api/clubInvite";
import { getClubInvitesByClubId } from "@/lib/api/clubInvite"; // <-- make sure this exists/exports
import { useTreasurerStore } from "@/store/treasurerStore";
import type { ClubInvite } from "@prisma/client";

// If your membership type includes user, keep it. Otherwise just use the store’s type.
import type { ClubMembershipWithUser } from "@/types/clubMembership";

export default function ClubMembers() {
  // ----- global treasurer context -----
  const treasurerClubId = useTreasurerStore((s) => s.treasurerClubId);
  const memberships = useTreasurerStore((s) => s.memberships) as ClubMembershipWithUser[];
  const loadingTreasurer = useTreasurerStore((s) => s.loading);

  // ----- invites -----
  const [invites, setInvites] = useState<ClubInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesErr, setInvitesErr] = useState<string | null>(null);

  // ----- invite form -----
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  // Build "Complete Accounts" list from memberships
  // NOTE: adjust the fields if your User model uses different names.
  const completeAccounts = useMemo(() => {
    return memberships
      .filter((m) => m.user) // should always be true if type includes user
      .map((m) => {
        const u: any = m.user;
        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
        const email = u.email ?? "";
        // change this if your field is phoneNumber vs phone
        const phone = u.phoneNumber ?? u.phone ?? "—";

        return { name: name || "—", email: email || "—", phone };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [memberships]);

  // Fetch invites for current treasurer club
  useEffect(() => {
    if (!treasurerClubId) return;

    let cancelled = false;

    (async () => {
      setInvitesLoading(true);
      setInvitesErr(null);
      try {
        const data = await getClubInvitesByClubId(treasurerClubId);
        if (!cancelled) setInvites(data);
      } catch (e: any) {
        if (!cancelled) setInvitesErr(e?.message ?? "Failed to fetch invites");
      } finally {
        if (!cancelled) setInvitesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [treasurerClubId]);

  async function handleInvite() {
    if (!email.trim() || !treasurerClubId) return;

    setSending(true);
    setMessage("");
    try {
      await createClubInvite({
        clubId: treasurerClubId,
        userEmail: email.trim(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      setEmail("");
      setMessage("Invite sent!");

      // refresh invites list immediately
      setInvitesLoading(true);
      const updated = await getClubInvitesByClubId(treasurerClubId);
      setInvites(updated);
    } catch (err: any) {
      setMessage("Failed to send invite");
    } finally {
      setSending(false);
      setInvitesLoading(false);
    }
  }

  const gate = loadingTreasurer ? (
    <div className="p-6 text-gray-500">Loading...</div>
  ) : !treasurerClubId ? (
    <div className="p-6 text-red-500">You do not have treasurer access.</div>
  ) : null;

  if (gate) return gate;

  return (
    <div className="flex gap-8">
      {/* LEFT: club members */}
      <div className="flex-1 min-w-[300px]">
        <h3 className="text-xl font-medium font-[family-name:var(--font-public-sans)] mb-2">
          Complete Accounts
        </h3>
        <p className="text-sm text-black font-[family-name:var(--font-pt-sans)] mb-4">
          Club members with completed Tally accounts can be reimbursed and see the status of their active reimbursements.
        </p>

        <div className="flex flex-col gap-2">
          {completeAccounts.length === 0 ? (
            <div className="text-sm text-gray-500">No members found.</div>
          ) : (
            completeAccounts.map((m, i) => (
              <div
                key={`${m.email}-${i}`}
                className="flex items-center border border-[#8D8B8B] rounded-lg px-4 py-3 text-sm font-[family-name:var(--font-public-sans)]"
              >
                <span className="w-[30%] truncate">{m.name}</span>
                <span className="w-[40%] truncate text-black">{m.email}</span>
                <span className="w-[30%] truncate text-black">{m.phone}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: invite + pending */}
      <div className="w-[440px] shrink-0 flex flex-col gap-3">
        <div className="bg-[#F5F5F5] rounded-xl p-6 flex flex-col items-center text-center border border-[#8D8B8B]">
          <Image src={InviteLogo} alt="Invite" width={44} height={44} className="mb-3" />
          <h2 className="text-[28px] font-bold font-[family-name:var(--font-public-sans)] mb-1">
            Invite a Club Member
          </h2>
          <p className="text-[15px] text-black font-[family-name:var(--font-pt-sans)] mb-4">
            Club members must create a Tally account before you can submit a reimbursement request for them.
          </p>

          <input
            type="email"
            placeholder="Their Tufts email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-[#8D8B8B] bg-white text-sm font-[family-name:var(--font-public-sans)] mb-3 outline-none focus:border-[#3172AE]"
          />

          <button
            onClick={handleInvite}
            disabled={sending || !treasurerClubId || !email.trim()}
            className="w-full py-2 bg-[#3172AE] text-white rounded-full font-[family-name:var(--font-public-sans)] font-medium text-base hover:bg-[#2861a0] transition-colors cursor-pointer disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send invite via email"}
          </button>

          {message && (
            <p className={`mt-2 text-sm ${message.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xl font-medium text-black font-[family-name:var(--font-public-sans)] mb-2">
            Pending Invitations / Incomplete Accounts
          </h3>
          <p className="text-sm text-black font-[family-name:var(--font-pt-sans)] mb-4">
            To complete a Tally account, club members must input their phone number and address.
          </p>

          {invitesLoading ? (
            <div className="text-sm text-gray-500">Loading invites...</div>
          ) : invitesErr ? (
            <div className="text-sm text-red-500">{invitesErr}</div>
          ) : invites.length === 0 ? (
            <div className="text-sm text-gray-500">No pending invites.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center border border-[#8D8B8B80] rounded-lg px-4 py-3 text-sm font-[family-name:var(--font-public-sans)]"
                >
                  <span className="w-[100%] truncate text-[#8D8B8B]">{inv.userEmail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}