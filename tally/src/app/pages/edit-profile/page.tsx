"use client";

import EditProfileForm from "@/app/components/EditProfileForm";
import NavBar from "@/app/components/NavBar";

export default function EditProfilePage() {
  return (
    <div className="min-h-screen bg-[#3172AE]">
      <NavBar title="Edit Your Profile" />
      
      <div className="pt-[64px] sm:pt-[80px] lg:pt-[100px]">
        <EditProfileForm />
      </div>
    </div>
  );
}
