"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getUserByClerkId, updateUser } from "@/lib/api/user";

export default function EditProfileForm() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    studentId: "",
    phone: "",
    pAddr1: "", pCity: "", pState: "", pZip: "",
    lAddr1: "", lCity: "", lState: "", lZip: "",
  });

  useEffect(() => {
    if (!isLoaded || !user) return;

    (async () => {
      try {
        const data = await getUserByClerkId(user.id);
        if (data) {
          setFormData({
            studentId: data.studentId || "",
            phone: data.phoneNumber || "",
            pAddr1: data.permAddress1 || "",
            pCity: data.permCity || "",
            pState: data.permState || "",
            pZip: data.permZip || "",
            lAddr1: data.tempAddress1 || "",
            lCity: data.tempCity || "",
            lState: data.tempState || "",
            lZip: data.tempZip || "",
          });
        }
      } catch (err) {
        setError("Could not retrieve profile data.");
      } finally {
        setFetching(false);
      }
    })();
  }, [isLoaded, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Using the updateUser helper from your user.ts
      await updateUser(user.id, {
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
      router.push("/pages/members"); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-20 text-center text-white font-bold font-[family-name:var(--font-pt-sans)]">Loading your info...</div>;

  return (
    <div className="font-[family-name:var(--font-pt-sans)] p-4 sm:p-8">
      <div className="bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl w-full max-w-[600px] mx-auto">
        <h2 className="text-[32px] font-bold text-gray-900 mb-4 font-[family-name:var(--font-public-sans)]">Update Information</h2>
        
        {error && <p className="text-red-500 mb-6 bg-red-50 p-3 rounded-lg">{error}</p>}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Identity & Contact */}
          <div className="grid grid-cols-2 gap-4">
            <input name="studentId" value={formData.studentId} onChange={handleChange} placeholder="Student ID" className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#3172AE]/20 outline-none" />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#3172AE]/20 outline-none" />
          </div>

          {/* Permanent Address */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Permanent Address</p>
            <input name="pAddr1" value={formData.pAddr1} onChange={handleChange} placeholder="Address Line 1" className="w-full border border-gray-200 rounded-xl p-3" />
            <div className="grid grid-cols-3 gap-3">
              <input name="pCity" value={formData.pCity} onChange={handleChange} placeholder="City" className="border border-gray-200 rounded-xl p-3" />
              <input name="pState" value={formData.pState} onChange={handleChange} placeholder="State" className="border border-gray-200 rounded-xl p-3" />
              <input name="pZip" value={formData.pZip} onChange={handleChange} placeholder="Zip" className="border border-gray-200 rounded-xl p-3" />
            </div>
          </div>

          {/* Local Address */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Local Address</p>
            <input name="lAddr1" value={formData.lAddr1} onChange={handleChange} placeholder="Address Line 1" className="w-full border border-gray-200 rounded-xl p-3" />
            <div className="grid grid-cols-3 gap-3">
              <input name="lCity" value={formData.lCity} onChange={handleChange} placeholder="City" className="border border-gray-200 rounded-xl p-3" />
              <input name="lState" value={formData.lState} onChange={handleChange} placeholder="State" className="border border-gray-200 rounded-xl p-3" />
              <input name="lZip" value={formData.lZip} onChange={handleChange} placeholder="Zip" className="border border-gray-200 rounded-xl p-3" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => router.back()} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[2] py-4 font-bold text-white bg-[#3172AE] rounded-xl hover:opacity-90 shadow-lg disabled:bg-gray-300 transition-all">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}