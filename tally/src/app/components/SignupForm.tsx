'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import logoFrame from '../assests/Frame.svg';
import logoText from '../assests/Group 1.svg';

interface SignupFormProps {
  subtitle: string;
  isTCU?: boolean;
}

export default function SignupForm({ subtitle, isTCU = false }: SignupFormProps) {
  const router = useRouter();
  
  // Track form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Check if all fields have values
  const isFormValid = Object.values(formData).every(value => value.trim() !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      router.push('/signup/complete');
    }
  };

  return (
    <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center relative overflow-hidden font-sans">
      {!isTCU && (
        <>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 border-[32px] border-white/10 rounded-full" />
          <div className="absolute -bottom-40 right-12 w-80 h-80 border-[32px] border-white/10 rounded-full" />
        </>
      )}

      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[540px] z-10 mx-4 text-center">
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Image src={logoFrame} alt="Logo" width={28} height={28} />
            <Image src={logoText} alt="Tally" width={75} height={26} />
          </div>
          <p className="text-[12px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-4 font-[family-name:var(--font-pt-sans)]">
            {subtitle}
          </p>
          <h1 className="text-[40px] font-extrabold text-gray-900 font-[family-name:var(--font-public-sans)] leading-tight tracking-tight">
            Sign up
          </h1>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="firstName"
              type="text"
              placeholder="First name"
              onChange={handleChange}
              className="font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              required
            />
            <input
              name="lastName"
              type="text"
              placeholder="Last name"
              onChange={handleChange}
              className="font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              required
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Tufts email"
            onChange={handleChange}
            className="w-full font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full font-[family-name:var(--font-pt-sans)] placeholder:text-[18px] border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            required
          />

          <button
            type="submit"
            disabled={!isFormValid}
            style={{ backgroundColor: isFormValid ? '#4a7cb9' : '#EAEAEA' }}
            className={`w-full ${isFormValid ? 'text-white' : 'text-gray-400'} font-bold py-4 rounded-xl transition-all mt-3 shadow-md text-[14px] font-[family-name:var(--font-pt-sans)]`}
          >
            Next
          </button>
        </form>

        <div className="mt-12 text-center text-[14px] text-gray-500 flex flex-col gap-3 font-[family-name:var(--font-pt-sans)]">
          <p>Already have an account? <a href="/login" className="text-blue-500 font-semibold hover:underline">Log in</a></p>
          {isTCU ? (
            <p>Not TCU Treasury? <a href="/signup" className="text-blue-500 font-semibold hover:underline">Student sign up</a></p>
          ) : (
            <p>TCU Treasury: <a href="/tcu-login" className="text-blue-500 font-semibold hover:underline">Log in</a></p>
          )}
        </div>
      </div>
    </div>
  );
}