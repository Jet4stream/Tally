import Image from "next/image";
import tallyLogo from "../assests/Tally.svg";
import userIcon from "../assests/userIcon.svg";

export default function MemberTopBar() {
  return (
    <div className="fixed top-0 inset-x-0 h-[64px] sm:h-[80px] lg:h-[100px] w-full bg-[#3172AE] z-50 flex justify-between items-center px-4 sm:px-6 lg:px-[32px]">
      <div className="flex flex-col gap-0 sm:gap-[2px] min-w-0">
        <div className="flex items-center gap-[8px]">
          <Image src={tallyLogo} alt="Tally logo" width={21} height={21} className="w-4 sm:w-5 lg:w-[21px] h-auto" />
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

      <Image src={userIcon} alt="User icon" width={49} height={49} className="w-8 sm:w-10 lg:w-[49px] h-auto ml-4 shrink-0" />
    </div>
  );
}