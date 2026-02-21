import Image from "next/image";
import tallyLogo from "../assests/Tally.svg";
import userIcon from "../assests/userIcon.svg";

export default function NavBar() {
  return (
    <div className="fixed top-0 inset-x-0 h-[124px] max-w-[1440px] mx-auto bg-[#3172AE] z-50 flex justify-between items-center pl-[32px] pr-[32px]">
  <div className="flex flex-col gap-[8px]">
    <div className="flex items-center gap-[8px]">
      <Image src={tallyLogo} alt="Tally logo" width={21} height={21} />
      <p className="text-[18px] font-[family-name:var(--font-pt-sans)] font-bold leading-[100%] text-white">
        Tally
      </p>
    </div>

    <div className="flex items-center gap-[16px]">
        <p className="text-[40px] font-[family-name:var(--font-public-sans)] font-bold leading-[100%] text-white">
            Vietnamese Association of Students at Tufts
        </p>
        <p className="text-[16px] font-[family-name:var(--font-public-sans)] text-white self-end mb-[4px]">
            Dept ID: A901146
        </p>
    </div>
  </div>

  <Image src={userIcon} alt="User icon" width={49} height={49} />
</div>
  );
}