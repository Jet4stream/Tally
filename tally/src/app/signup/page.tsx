import React from 'react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#3b71b1] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Decorative Rings */}
      <div className="absolute -bottom-16 -right-16 w-64 h-64 border-[32px] border-white/10 rounded-full" />
      <div className="absolute -bottom-40 right-12 w-80 h-80 border-[32px] border-white/10 rounded-full" />

      {/* Signup Card */}
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl w-full max-w-[480px] z-10 mx-4">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-4">
             <div className="bg-black text-white p-1 rounded flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
             </div>
             <span className="text-2xl font-bold tracking-tight text-gray-900">Tally</span>
          </div>
          <p className="text-[11px] font-bold text-gray-500 tracking-[0.15em] uppercase mb-2">
            Club Treasurers · Club Members
          </p>
          <h1 className="text-4xl font-extrabold text-gray-900">Sign up</h1>
        </div>

        {/* Form */}
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First name"
              className="border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              required
            />
            <input
              type="text"
              placeholder="Last name"
              className="border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              required
            />
          </div>
          
          <input
            type="email"
            placeholder="Tufts email"
            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            required
          />

          <button
            type="submit"
            className="w-full bg-[#4a7cb9] hover:bg-[#3d69a0] text-white font-bold py-3.5 rounded-md transition-colors duration-200 mt-2 shadow-sm"
          >
            Next
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center text-[13px] text-gray-600 space-y-2">
          <p>
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              Log in
            </a>
          </p>
          <p>
            TCU Treasury:{' '}
            <a href="/tcu-login" className="text-blue-500 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}