"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MembershipRole } from "@prisma/client";
import { useUser } from "@clerk/nextjs";

import logoFrame from "../../assests/Frame.svg";
import logoText from "../../assests/Group 1.svg";

import { getClubInvitesByEmail, deleteClubInvitesByEmailAndClubId } from "@/lib/api/clubInvite";
import { createClubMembership, getClubMembershipsByUserId } from "@/lib/api/clubMembership";
import { getClubById } from "@/lib/api/club";

type InviteUI = {
  clubId: string;
  clubName: string;
  role: MembershipRole;
};

type InviteRaw = any;

function normalizeEmail(s: string) {
  return s.trim().toLowerCase();
}

function pickRole(a: MembershipRole, b: MembershipRole) {
  if (a === MembershipRole.TREASURER || b === MembershipRole.TREASURER) return MembershipRole.TREASURER;
  return a ?? b ?? MembershipRole.MEMBER;
}

export default function ClubInvitesClient({
  initialInvites,
}: {
  initialInvites?: { clubId: string; clubName: string; role: string }[];
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const userId = user?.id;
  const email = user?.primaryEmailAddress?.emailAddress;

  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyClubIds, setBusyClubIds] = useState<Set<string>>(new Set());

  const [invites, setInvites] = useState<InviteUI[]>(
    (initialInvites ?? []).map((i) => ({
      clubId: i.clubId,
      clubName: i.clubName,
      role: (i.role as MembershipRole) ?? MembershipRole.MEMBER,
    }))
  );

  const setBusy = (clubId: string, on: boolean) => {
    setBusyClubIds((prev) => {
      const next = new Set(prev);
      on ? next.add(clubId) : next.delete(clubId);
      return next;
    });
  };

  useEffect(() => {
    if (!isLoaded || !email || !userId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setPageError("");

        const normalizedEmail = normalizeEmail(email);

        const [rawInvites, memberships] = await Promise.all([
          getClubInvitesByEmail(normalizedEmail),
          getClubMembershipsByUserId(userId),
        ]);

        if (cancelled) return;

        const memberClubIds = new Set((memberships ?? []).map((m: any) => m.clubId));

        const map = new Map<string, InviteUI>();

        for (const inv of (rawInvites ?? []) as InviteRaw[]) {
          const clubId = inv.clubId;
          if (!clubId) continue;
          if (memberClubIds.has(clubId)) continue;
          const data = await getClubById(clubId)
          const clubName = data.name;
          const role = (inv.role as MembershipRole) ?? MembershipRole.MEMBER;

          const existing = map.get(clubId);
          if (!existing) {
            map.set(clubId, { clubId, clubName, role });
          } else {
            map.set(clubId, {
              ...existing,
              role: pickRole(existing.role, role),
            });
          }
        }

        setInvites(Array.from(map.values()).sort((a, b) => a.clubName.localeCompare(b.clubName)));
      } catch (e) {
        console.error("Load viable invitations error:", e);
        setPageError("Could not load your invitations. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, userId, isLoaded]);

  const acceptInvite = async (inv: InviteUI) => {
    if (!userId || !email) return;
    setPageError("");
    setBusy(inv.clubId, true);
    try {
      await deleteClubInvitesByEmailAndClubId(normalizeEmail(email), inv.clubId);
      await createClubMembership({
        clubId: inv.clubId,
        userId,
        role: inv.role ?? MembershipRole.MEMBER,
      });

      

      setInvites((prev) => prev.filter((x) => x.clubId !== inv.clubId));
    } catch (e) {
      console.error(e);
      setPageError("Could not accept invitation. Please try again.");
    } finally {
      setBusy(inv.clubId, false);
    }
  };

  const declineInvite = async (inv: InviteUI) => {
    if (!email) return;
    setPageError("");
    setBusy(inv.clubId, true);
    try {
      await deleteClubInvitesByEmailAndClubId(normalizeEmail(email), inv.clubId);
      setInvites((prev) => prev.filter((x) => x.clubId !== inv.clubId));
    } catch (e) {
      console.error(e);
      setPageError("Could not decline invitation. Please try again.");
    } finally {
      setBusy(inv.clubId, false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center">
        <div className="text-white font-[family-name:var(--font-pt-sans)]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute -bottom-16 -right-16 w-64 h-64 border-[32px] border-white/10 rounded-full" />
      <div className="absolute -bottom-40 right-12 w-80 h-80 border-[32px] border-white/10 rounded-full" />

      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[640px] z-10 mx-4 text-center relative">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-8">
            <Image src={logoFrame} alt="Logo" width={28} height={28} />
            <Image src={logoText} alt="Tally" width={75} height={26} />
          </div>

          <p className="text-[12px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-4 font-[family-name:var(--font-pt-sans)]">
            CLUB INVITATIONS
          </p>

          <h1 className="text-[34px] font-extrabold text-gray-900 font-[family-name:var(--font-public-sans)] leading-tight tracking-tight">
            You've been invited
          </h1>

          <p className="mt-3 text-[14px] text-gray-600 font-[family-name:var(--font-pt-sans)]">
            Accept to join a club. Decline to remove the invitation.
          </p>
        </div>

        {pageError && (
          <div className="mb-4 text-sm text-red-600 font-[family-name:var(--font-pt-sans)]">
            {pageError}
          </div>
        )}

        {loading ? (
          <div className="text-gray-600 font-[family-name:var(--font-pt-sans)]">Loading invitations…</div>
        ) : invites.length === 0 ? (
          <div className="text-gray-700 font-[family-name:var(--font-pt-sans)]">
            <p className="font-semibold">No pending invitations.</p>
            <p className="text-gray-600 mt-2">You can return to the home page.</p>

            <div className="mt-8">
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-xl bg-[#4a7cb9] text-white font-bold shadow-md text-[14px] font-[family-name:var(--font-pt-sans)]"
              >
                Go home
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-left">
            {invites.map((inv) => {
              const busy = busyClubIds.has(inv.clubId);

              return (
                <div
                  key={inv.clubId}
                  className="border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 font-[family-name:var(--font-public-sans)] truncate">
                      {inv.clubName}
                    </div>
                    <div className="text-[12px] text-gray-600 font-[family-name:var(--font-pt-sans)] mt-1">
                      Role: <span className="font-semibold">{inv.role}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={busy}
                      onClick={() => acceptInvite(inv)}
                      className={`px-4 py-2 rounded-xl font-bold text-[13px] shadow-sm ${
                        busy ? "bg-gray-200 text-gray-500" : "bg-[#4a7cb9] text-white"
                      } font-[family-name:var(--font-pt-sans)]`}
                    >
                      {busy ? "Working…" : "Accept"}
                    </button>

                    <button
                      disabled={busy}
                      onClick={() => declineInvite(inv)}
                      className={`px-4 py-2 rounded-xl font-bold text-[13px] border ${
                        busy ? "border-gray-200 text-gray-400" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      } font-[family-name:var(--font-pt-sans)]`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-blue-500 font-semibold hover:underline text-[13px]"
              >
                Skip for now and go home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}