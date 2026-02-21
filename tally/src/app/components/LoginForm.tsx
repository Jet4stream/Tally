'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation";

import logoFrame from '../assests/Frame.svg';
import logoText from '../assests/Group 1.svg';

interface LoginFormProps {
  subtitle: string;
  isTCU?: boolean;
}

export default function LoginForm({ subtitle, isTCU = false }: LoginFormProps) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  // Track input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if both fields are filled
  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleSubmit = async () => {
    setError("");
    if (!isLoaded) return;

    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        router.push("/");
      } else {
        setError("Additional verification required.");
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      setError(
        clerkError?.longMessage ||
        clerkError?.message ||
        "Login failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Decorative Rings */}
      {!isTCU && (
        <>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 border-[32px] border-white/10 rounded-full" />
          <div className="absolute -bottom-40 right-12 w-80 h-80 border-[32px] border-white/10 rounded-full" />
        </>
      )}

      {/* Login Card */}
      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[540px] z-10 mx-4 text-center relative">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Image src={logoFrame} alt="Logo" width={28} height={28} />
            <Image src={logoText} alt="Tally" width={75} height={26} />
          </div>
          
          <p className="text-[12px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-4 font-[family-name:var(--font-pt-sans)]">
            {subtitle}
          </p>
          
          <h1 className="text-[40px] font-extrabold text-gray-900 font-[family-name:var(--font-public-sans)] leading-tight tracking-tight">
            Welcome back!
          </h1>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Tufts email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            required
          />

          <button
            type="submit"
            disabled={!isFormValid}
            style={{ backgroundColor: isFormValid ? '#4a7cb9' : '#EAEAEA' }}
            className={`w-full ${isFormValid ? 'text-white' : 'text-gray-400'} font-bold py-4 rounded-xl transition-all mt-3 shadow-md text-[14px] font-[family-name:var(--font-pt-sans)]`}
          >
            Log in
          </button>
        </form>

        {/* Dynamic Footer Section */}
        <div className="mt-12 text-center text-[12px] text-gray-900 leading-relaxed font-[family-name:var(--font-pt-sans)] flex flex-col gap-4">
          {isTCU ? (
            <p>
              Not TCU Treasury? <Link href="/login" className="text-blue-500 font-semibold hover:underline">Student log in</Link>
            </p>
          ) : (
            <>
              <div className="text-gray-900 font-bold text-center">
                <p>Don&apos;t have an account?</p>
                <p className="font-normal text-gray-600">Club members: Contact your club treasurer.</p>
                <p className="font-normal text-gray-600">Club treasurers: Contact TCU Treasury.</p>
              </div>
              <p className="mt-2 text-gray-600">
                TCU Treasury: <Link href="/tcu-login" className="text-blue-500 font-semibold hover:underline">Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}