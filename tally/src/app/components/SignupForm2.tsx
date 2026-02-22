"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useUser } from "@clerk/nextjs";
import { createUser } from "../../lib/api/user";
import { GlobalRole, ClubInvite } from "@prisma/client";
import { getClubInvitesByEmail } from "@/lib/api/clubInvite";

export default function CompleteAccountForm() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to read URL params

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Determine role based on URL
  const isTCU = searchParams.get("role") === "TCU";
  const assignedRole = isTCU ? GlobalRole.TCU_TREASURER : GlobalRole.STANDARD;

  const [formData, setFormData] = useState({
    studentId: "",
    phone: "",
    pAddr1: "",
    pCity: "",
    pState: "",
    pZip: "",
    pCountry: "",
    lAddr1: "",
    lCity: "",
    lState: "",
    lZip: "",
    lCountry: "",
  });

  if (!isLoaded) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = Object.values(formData).every(
    (value) => value.trim() !== "",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user) return;

    setLoading(true);
    try {
      const normalizedEmail = (user.primaryEmailAddress?.emailAddress || "").trim().toLowerCase();
      await createUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: assignedRole, // Uses the role derived from the URL
        studentId: formData.studentId,
        phoneNumber: formData.phone,
        permAddress1: formData.pAddr1,
        permCity: formData.pCity,
        permState: formData.pState,
        permZip: formData.pZip,
        tempAddress1: formData.lAddr1,
        tempCity: formData.lCity,
        tempState: formData.lState,
        tempZip: formData.lZip,
      });
      if (isTCU) {
        router.push("/pages/tcu");
      }

       let invites: ClubInvite[] = [];
      try {
        invites = await getClubInvitesByEmail(normalizedEmail);
      } catch (e) {
        // if invite lookup fails, don't block account completion
        console.error("Invite lookup failed:", e);
        invites = [];
      }

      if ((invites ?? []).length > 0) {
        router.push("/pages/clubMember");
        return;
      }

      router.push("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to create account profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3b71b1] font-sans p-8 py-20 overflow-y-auto">
      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[600px] mx-auto text-center">
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-[40px] font-extrabold text-gray-900 leading-tight mb-4">
            Complete your Tally account
          </h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
        </div>

        <form className="flex flex-col gap-6 text-left" onSubmit={handleSubmit}>
          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="studentId"
              onChange={handleChange}
              placeholder="Student ID"
              className="border border-gray-300 rounded-xl p-3"
              required
            />
            <input
              name="phone"
              onChange={handleChange}
              placeholder="Phone number"
              className="border border-gray-300 rounded-xl p-3"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-bold text-gray-900">
              Permanent Address
            </label>
            <input
              name="pAddr1"
              onChange={handleChange}
              placeholder="Address line 1"
              className="border border-gray-300 rounded-xl p-3"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="pCity"
                onChange={handleChange}
                placeholder="City"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
              <input
                name="pState"
                onChange={handleChange}
                placeholder="State"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                name="pZip"
                onChange={handleChange}
                placeholder="Zip code"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
              <input
                name="pCountry"
                onChange={handleChange}
                placeholder="Country"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-bold text-gray-900">
              Local Address
            </label>
            <input
              name="lAddr1"
              onChange={handleChange}
              placeholder="Address line 1"
              className="border border-gray-300 rounded-xl p-3"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="lCity"
                onChange={handleChange}
                placeholder="City"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
              <input
                name="lState"
                onChange={handleChange}
                placeholder="State"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                name="lZip"
                onChange={handleChange}
                placeholder="Zip code"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
              <input
                name="lCountry"
                onChange={handleChange}
                placeholder="Country"
                className="border border-gray-300 rounded-xl p-3"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-4 rounded-xl font-bold shadow-md transition-all mt-6 ${
              isFormValid && !loading
                ? "bg-[#4a7cb9] text-white"
                : "bg-[#EAEAEA] text-gray-400"
            }`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
