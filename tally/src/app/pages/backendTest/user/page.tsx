"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { createUser } from "@/lib/api/user";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "STANDARD";

  const { isLoaded, signUp } = useSignUp();

  const [firstName, setFirstName] = useState("Test");
  const [lastName, setLastName] = useState("User");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    setSubmitError("");
    if (!isLoaded) return;

    if (password !== repeatPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      console.log("signUp.create result:", result);
      console.log("status:", result.status);
      console.log("createdUserId:", result.createdUserId);

      const clerkId = result.createdUserId;
      if (!clerkId) {
        setSubmitError("Clerk user was created but no userId was returned.");
        return;
      }

      await createUser({
        id: clerkId,
        firstName,
        lastName,
        email,
        role: "STANDARD",
        studentId: "12345678",
        phoneNumber: phone,
        permAddress1: "123 Permanent St",
        permCity: "Tacoma",
        permState: "WA",
        permZip: "98402",
        tempAddress1: "456 Temporary Ave",
        tempCity: "Medford",
        tempState: "MA",
        tempZip: "02155",
      });

      // await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      // router.push(`/verifyEmail?type=${type}`);
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const code = clerkError?.code;

      if (code === "form_identifier_exists") {
        setSubmitError(
          "An account with that email already exists. Try logging in instead."
        );
        return;
      }

      const msg =
        clerkError?.longMessage ||
        clerkError?.message ||
        err?.message ||
        "Sign up failed.";

      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center px-4 py-12 bg-gray-50">
      <main className="w-full max-w-xl flex flex-col items-center gap-6">
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
          className="opacity-80"
        />

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Signup Test Page</h1>
          <p className="text-gray-600">
            Fill the fields and click “Test Sign Up”.
          </p>
        </div>

        <div className="w-full max-w-md grid gap-3">
          <input
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
          />

          <input
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="password"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Repeat password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />

          {submitError && (
            <div className="text-sm text-red-600">{submitError}</div>
          )}

          <div id="clerk-captcha" />

          <button
            onClick={handleClick}
            disabled={!isLoaded || isSubmitting}
            className="mt-2 px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Test Sign Up"}
          </button>

          <div className="text-xs text-gray-500">
            Clerk loaded: {String(isLoaded)}
          </div>
        </div>
      </main>
    </div>
  );
}