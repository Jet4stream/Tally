import NavBar from "@/app/components/NavBar";
import TCUTabSpacer from "@/app/components/TabSpacerTCU";

export default function Page() {
  return (
    <div>
      <NavBar title="TCU Treasury" />
      <div className="mt-[64px] sm:mt-[80px] lg:mt-[100px]">
        <TCUTabSpacer />
      </div>
    </div>
  );
}