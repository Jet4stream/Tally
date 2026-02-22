import Link from "next/link";

export default function NewReimbursementButton() {
  return (
    <Link
      href="/reimbursement/new"
      className="fixed bottom-8 right-8 inline-flex items-center gap-2 px-6 py-3 border-2 border-[#3172AE] rounded-full text-[#3172AE] font-[family-name:var(--font-public-sans)] font-medium text-base hover:bg-[#3172AE] hover:text-white transition-colors cursor-pointer bg-white z-50"
    >
      <span className="text-xl">+</span>
      New Reimbursement
    </Link>
  );
}