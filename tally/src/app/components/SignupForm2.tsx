'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserDetails } from '../actions/user'; // Import the action

export default function SignupForm2() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '', phone: '',
    pAddr1: '', pCity: '', pState: '', pZip: '', pCountry: '', // Country isn't in your schema, we can omit or add
    lAddr1: '', lCity: '', lState: '', lZip: '', lCountry: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    const result = await updateUserDetails(formData);
    setLoading(false);

    if (result.success) {
      router.push('/dashboard'); // Send them to the app!
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center relative overflow-hidden font-sans p-8">
      <div className="bg-white p-16 rounded-[2rem] shadow-2xl w-full max-w-[600px] z-10 text-center">
        
        {/* Header Section unchanged */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-[40px] font-extrabold text-gray-900 font-[family-name:var(--font-public-sans)] leading-tight mb-4">
            Complete your Tally account
          </h1>
          <p className="text-[14px] text-gray-600 font-[family-name:var(--font-pt-sans)]">
            The TCU Treasury uses the following information for reimbursement fulfillment:
          </p>
        </div>

        <form className="flex flex-col gap-6 text-left" onSubmit={handleSubmit}>
          {/* ... all your inputs stay exactly the same ... */}

          <button
            type="submit"
            disabled={!isFormValid || loading}
            style={{ backgroundColor: isFormValid && !loading ? '#4a7cb9' : '#EAEAEA' }}
            className={`w-full ${isFormValid && !loading ? 'text-white' : 'text-gray-400'} font-bold py-4 rounded-xl transition-all mt-6 shadow-md text-[16px] font-[family-name:var(--font-pt-sans)]`}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}