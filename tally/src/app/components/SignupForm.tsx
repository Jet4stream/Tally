"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";

import logoFrame from "../assests/Frame.svg";
import logoText from "../assests/Group 1.svg";

export default function SignupForm({ subtitle, isTCU = false }: { subtitle: string; isTCU?: boolean }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "",
  });
  const [error, setError] = useState("");

  // FIX: If the user is already partially signed up (e.g. they refreshed), 
  // check status and resume verification mode if needed.
  useEffect(() => {
    if (signUp?.status === "missing_requirements") {
      setVerifying(true);
    }
  }, [signUp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = Object.values(formData).every((v) => v.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !isFormValid) return;

    try {
      // Logic: Only create if we don't have an active signup attempt
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
      setError("");
    } catch (err: any) {
      if (err.errors?.[0]?.code === "session_exists") {
        router.push("/signup/complete");
        return;
      }
      setError(err.errors?.[0]?.message || "Something went wrong.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/signup/complete");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code.");
    }
  };

  return (
    <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center relative overflow-hidden font-sans">
      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[540px] z-10 mx-4 text-center">
        
        {/* Verification View */}
        {verifying ? (
          <div className="flex flex-col items-center">
            <h1 className="text-[32px] font-extrabold text-gray-900 mb-4">Check your email</h1>
            <p className="text-gray-500 mb-8">Enter the 6-digit code sent to your email.</p>
            <form onSubmit={handleVerify} className="w-full flex flex-col gap-5">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <input
                value={code}
                placeholder="000000"
                onChange={(e) => setCode(e.target.value)}
                className="border border-gray-300 rounded-xl p-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button type="submit" className="w-full bg-[#4a7cb9] text-white font-bold py-4 rounded-xl shadow-md">
                Verify Email
              </button>
            </form>
          </div>
        ) : (
          /* Initial Signup View */
          <>
            <div className="flex flex-col items-center mb-12">
              <div className="flex items-center gap-3 mb-8">
                <Image src={logoFrame} alt="Logo" width={28} height={28} />
                <Image src={logoText} alt="Tally" width={75} height={26} />
              </div>
              <p className="text-[12px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-4 font-[family-name:var(--font-pt-sans)]">
                {subtitle}
              </p>
              <h1 className="text-[40px] font-extrabold text-gray-900 leading-tight">Sign up</h1>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <input name="firstName" placeholder="First name" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />
                <input name="lastName" placeholder="Last name" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />
              </div>
              <input name="email" type="email" placeholder="Tufts email" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />
              <input name="password" type="password" placeholder="Password" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />
              
              <button
                type="submit"
                disabled={!isFormValid}
                style={{ backgroundColor: isFormValid ? "#4a7cb9" : "#EAEAEA" }}
                className={`w-full ${isFormValid ? "text-white" : "text-gray-400"} font-bold py-4 rounded-xl shadow-md`}
              >
                Next
              </button>
            </form>
          </>
        )}

        {/* CRITICAL FIX: Keep the captcha div in the DOM regardless of 'verifying' state.
            We use hidden class instead of conditional rendering to keep the DOM node alive.
        */}
        <div id="clerk-captcha" className={verifying ? "hidden" : "my-2"}></div>

      </div>
    </div>
  );
}