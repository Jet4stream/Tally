"use client";

import React, { useState } from "react";

export default function CompleteAccountForm() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Check all required fields (excluding optional)
  const isFormValid = Object.values(formData).every(
    (value) => value.trim() !== "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      console.log("Form Submitted", formData);
      // Add your submission logic here
    }
  };

  return (
    <div className="min-h-screen bg-[#3b71b1] font-sans p-8 py-20 overflow-y-auto">
      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[600px] mx-auto text-center">
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-[40px] font-extrabold text-gray-900 font-[family-name:var(--font-public-sans)] leading-tight mb-4">
            Complete your Tally account
          </h1>
          <p className="text-[14px] text-gray-600 font-[family-name:var(--font-pt-sans)] max-w-[400px]">
            The TCU Treasury uses the following information for reimbursement
            fulfillment:
          </p>
        </div>

        <form className="flex flex-col gap-6 text-left" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="studentId"
              onChange={handleChange}
              type="text"
              placeholder="Student ID"
              className="font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              required
            />
            <input
              name="phone"
              onChange={handleChange}
              type="text"
              placeholder="Phone number"
              className="font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-bold text-gray-900 font-[family-name:var(--font-pt-sans)]">
              Permanent Address
            </label>
            <input
              name="pAddr1"
              onChange={handleChange}
              type="text"
              placeholder="Address line 1"
              className="w-full border border-gray-300 rounded-xl p-3 text-base font-[family-name:var(--font-pt-sans)] placeholder-gray-400"
              required
            />
            <input
              type="text"
              placeholder="Address line 2 (optional)"
              className="w-full border border-gray-300 rounded-xl p-3 text-base font-[family-name:var(--font-pt-sans)] placeholder-gray-400"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="pCity"
                onChange={handleChange}
                type="text"
                placeholder="City"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
              <input
                name="pState"
                onChange={handleChange}
                type="text"
                placeholder="State"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                name="pZip"
                onChange={handleChange}
                type="text"
                placeholder="Zip code"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
              <input
                name="pCountry"
                onChange={handleChange}
                type="text"
                placeholder="Country"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-bold text-gray-900 font-[family-name:var(--font-pt-sans)]">
              Local Address
            </label>
            <input
              name="lAddr1"
              onChange={handleChange}
              type="text"
              placeholder="Address line 1"
              className="w-full border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
              required
            />
            <input
              type="text"
              placeholder="Address line 2 (optional)"
              className="w-full border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="lCity"
                onChange={handleChange}
                type="text"
                placeholder="City"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
              <input
                name="lState"
                onChange={handleChange}
                type="text"
                placeholder="State"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                name="lZip"
                onChange={handleChange}
                type="text"
                placeholder="Zip code"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
              <input
                name="lCountry"
                onChange={handleChange}
                type="text"
                placeholder="Country"
                className="border border-gray-300 rounded-xl p-3 text-base placeholder-gray-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            style={{ backgroundColor: isFormValid ? "#4a7cb9" : "#EAEAEA" }}
            className={`w-full ${isFormValid ? "text-white" : "text-gray-400"} font-bold py-4 rounded-xl transition-all mt-6 shadow-md text-[16px] font-[family-name:var(--font-pt-sans)]`}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
