"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

import tallyLogo from "../assests/Tally.svg";
import userIcon from "../assests/userIcon.svg";

export default function MemberTopBar() {
  // dropdown state
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    router.push("/pages/login");
  };

  const handleEditProfile = () => {
    setOpen(false);
    router.push("/pages/edit-profile"); // change if your route differs
  };

  // close dropdown on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className="h-[64px] sm:h-[80px] lg:h-[100px] w-full bg-[#3172AE] z-50 flex justify-between items-center px-4 sm:px-6 lg:px-[32px] overflow-visible">
      <div className="flex flex-col gap-0 sm:gap-[2px] min-w-0">
        <div className="flex items-center gap-[8px]">
          <Image
            src={tallyLogo}
            alt="Tally logo"
            width={21}
            height={21}
            className="w-4 sm:w-5 lg:w-[21px] h-auto"
          />
          <p className="text-sm sm:text-base lg:text-[18px] font-[family-name:var(--font-pt-sans)] font-bold leading-[120%] text-white">
            Tally
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-[16px]">
          <p className="text-xl sm:text-3xl lg:text-[40px] font-[family-name:var(--font-public-sans)] font-bold leading-[120%] text-white truncate">
            Your Reimbursements
          </p>
        </div>
      </div>

      {/* User icon + dropdown */}
      <div className="relative ml-4 shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Image
            src={userIcon}
            alt="User menu"
            width={49}
            height={49}
            className="w-8 sm:w-10 lg:w-[49px] h-auto"
          />
        </button>

        {open && (
          <div
            className="fixed top-[48px] sm:top-[64px] lg:top-[84px] right-4 sm:right-6 lg:right-[32px] w-48 rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden z-50"
            role="menu"
          >
            <button
              onClick={handleEditProfile}
              className="w-full text-left px-4 py-3 text-sm font-medium font-[family-name:var(--font-pt-sans)] text-black hover:bg-gray-50"
              role="menuitem"
            >
              Edit Profile
            </button>

            <div className="h-px bg-gray-100" />

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm font-medium font-[family-name:var(--font-pt-sans)] text-red-600 hover:bg-red-50"
              role="menuitem"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}