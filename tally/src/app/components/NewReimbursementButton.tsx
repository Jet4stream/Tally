import Link from "next/link";

export default function NewReimbursementButton() {
  return (
<Link href="/pages/reimbur/" className="group fixed  bottom-8 right-8 inline-flex items-center gap-2 px-6 py-3 border-2 border-[#3172AE] rounded-full text-[#3172AE] font-[family-name:var(--font-pt-sans)] font-bold text-base hover:bg-[#3172AE] hover:text-white transition-colors cursor-pointer bg-white z-50 shadow-[0_4px_8px_rgba(0,0,0,0.15)]"

>
  <span className="text-xl font-bold text-[#3172AE] group-hover:text-white">+</span>
<span className="text-[#3172AE] font-bold group-hover:text-white">New Reimbursement</span>
</Link>
  );
}