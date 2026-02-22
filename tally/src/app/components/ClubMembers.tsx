"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import InviteLogo from "../assests/Invite.svg";
import { createClubInvite } from "@/lib/api/clubInvite";
import { useUser } from "@clerk/nextjs";

const completeAccounts = [
  { name: "Ashley Wu", email: "ashley.wu@tufts.edu", phone: "917-855-3082" },
  { name: "Ashley Wu", email: "ashley.wu@tufts.edu", phone: "917-855-3082" },
  { name: "Ashley Wu", email: "ashley.wu@tufts.edu", phone: "917-855-3082" },
];

export default function ClubMembers() {
  const { user } = useUser();
  const [clubId, setClubId] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/clubMemberships?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.[0]?.clubId) {
          setClubId(data.data[0].clubId);
        }
      });
  }, [user?.id]);

  async function handleInvite() {
    if (!email || !clubId) return;
    setSending(true);
    setMessage("");
    try {
      await createClubInvite({
        clubId,
        userEmail: email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //one week to accept invite
      });
      setEmail("");
      setMessage("Invite sent!");
    } catch (err) {
      setMessage("Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-[300px]">
        <h3 className="text-xl font-medium font-[family-name:var(--font-public-sans)] mb-2">
          Complete Accounts
        </h3>
        <p className="text-sm text-black font-[family-name:var(--font-pt-sans)] mb-4">
          Club members with completed Tally accounts can be reimbursed and see the status of their active reimbursements.
        </p>
        <div className="flex flex-col gap-2">
          {completeAccounts.map((m, i) => (
            <div key={i} className="flex items-center border border-[#8D8B8B] rounded-lg px-4 py-3 text-sm font-[family-name:var(--font-public-sans)]">
              <span className="w-[30%] truncate">{m.name}</span>
              <span className="w-[40%] truncate text-black">{m.email}</span>
              <span className="w-[30%] truncate text-black">{m.phone}</span>
            </div>
          ))}
        </div>
      </div>

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
            disabled={sending || !clubId}
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center border border-[#8D8B8B80] rounded-lg px-4 py-3 text-sm font-[family-name:var(--font-public-sans)]">
              <span className="w-[40%] text-[#8D8B8B]">Jet Yotsuuye</span>
              <span className="text-[#8D8B8B]">jet.yotsuuye@tufts.edu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}