"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";

import logoFrame from "../assests/Frame.svg";
import logoText from "../assests/Group 1.svg";

export default function SignupForm({ subtitle, isTCU = false }: { subtitle: string; isTCU?: boolean }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "",
  });
  const [error, setError] = useState("");

  /**
   * REMOVED: The useEffect that was forcing setVerifying(true).
   * This was likely the reason the screen was switching even when an error occurred.
   */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = Object.values(formData).every((v) => v.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !isFormValid) return;
    setLoading(true);
    setError(""); // Clear error at start of attempt

    try {
      /**
       * 1. Create the signup attempt. 
       * This is where Clerk checks for existing emails and breached passwords.
       */
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      /**
       * 2. Prepare verification.
       * If step 1 fails, the code will jump to the catch block and never reach here.
       */
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      
      // 3. ONLY switch the UI if both above steps were successful
      setVerifying(true);
      
    } catch (err: any) {
      const clerkError = err.errors?.[0];
      
      if (clerkError?.code === "form_identifier_exists") {
        setError("This email is already in use.");
      } else if (clerkError?.code === "session_exists") {
        router.push("/pages/signup/complete");
      } else {
        // This catches the "password breach" error message directly from Clerk
        setError(clerkError?.message || "Something went wrong.");
      }
      
      // Explicitly ensure we stay on the signup screen
      setVerifying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/pages/signup/complete");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <div className="flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center relative overflow-hidden font-sans">
      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[540px] z-10 mx-4 text-center transition-all duration-300">
        
        {verifying ? (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <h1 className="text-[32px] font-extrabold text-gray-900 mb-4">Check your email</h1>
            <p className="text-gray-500 mb-8">Enter the 6-digit code sent to your email.</p>
            <form onSubmit={handleVerify} className="w-full flex flex-col gap-5">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <input
                value={code}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setCode(val);
                }}
                className="border border-gray-300 rounded-xl p-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#4a7cb9] text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center min-h-[56px]"
              >
                {loading ? <Spinner /> : "Verify Email"}
              </button>
            </form>
          </div>
        ) : (
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
              {/* Error display is now inside the form for better visibility */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-left">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <input name="firstName" placeholder="First name" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />
                <input name="lastName" placeholder="Last name" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />
              </div>
              <input name="email" type="email" placeholder="Tufts email" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />
              <input name="password" type="password" placeholder="Password" onChange={handleChange} className="border border-gray-300 rounded-xl p-3" required />

              <button
                type="submit"
                disabled={!isFormValid || loading}
                style={{ backgroundColor: !isFormValid ? "#EAEAEA" : "#4a7cb9" }}
                className={`w-full ${isFormValid ? "text-white" : "text-gray-400"} font-bold py-4 rounded-xl shadow-md flex items-center justify-center min-h-[56px]`}
              >
                {loading ? <Spinner /> : "Next"}
              </button>
            </form>

            <p className="mt-8 text-gray-500 text-sm">
              Already have an account?{" "}
              <Link href="/pages/login" className="text-[#4a7cb9] font-bold hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
      <div id="clerk-captcha"></div>
    </div>
  );
}
