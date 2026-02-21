import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {

  // const handleClick = async () => {
  // setSubmitError("");
  // if (!isLoaded) return;

  // if (password !== repeatPassword) {
  //   setSubmitError("Passwords do not match.");
  //   return;
  // }

  // try {  
  //   // 1) Create Clerk account
  //   const result = await signUp.create({
  //     emailAddress: email,
  //     password,
  //     firstName,
  //     lastName,
  //   });

  //   const clerkId = result.createdUserId;
  //   if (!clerkId) {
  //     setSubmitError("Clerk user was created but no userId was returned.");
  //     return;
  //   }

  //   // 2) Create Supabase/Prisma user (YOUR axios helper)
  //   // IMPORTANT: You said you only create when you have all variables.
  //   // For now, fill addresses/studentId with whatever your UI collects.
  //   await createUser({
  //     id: clerkId,
  //     firstName,
  //     lastName,
  //     email,
  //     role: "STANDARD", // or use `type` mapping

  //     studentId: "12345678",          // TODO: replace with real input
  //     phoneNumber: phone,

  //     permAddress1: "123 Permanent St", // TODO: replace with real input
  //     permCity: "Tacoma",
  //     permState: "WA",
  //     permZip: "98402",

  //     tempAddress1: "456 Temporary Ave", // TODO: replace with real input
  //     tempCity: "Medford",
  //     tempState: "MA",
  //     tempZip: "02155",
  //   });

  //   // 3) Start email verification (keep your flow)
  //   await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

  //   router.push(`/pages/verifyEmail?type=${type}`);
  // } catch (err: any) {
  //   const clerkError = err?.errors?.[0];
  //   const code = clerkError?.code;

  //   if (code === "form_identifier_exists") {
  //     setSubmitError("An account with that email already exists. Try logging in instead.");
  //     return;
  //   }

  //   const msg =
  //     clerkError?.longMessage ||
  //     clerkError?.message ||
  //     err?.message ||
  //     "Sign up failed.";

  //   setSubmitError(msg);
  // }
// };
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>To get started, edit the page.tsx file.</h1>
          <p>
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className={styles.secondary}
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
