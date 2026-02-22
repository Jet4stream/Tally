import NavBar from "@/app/components/NavBar";
import TCUTabSpacer from "@/app/components/TabSpacerTCU";

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="mt-[64px] sm:mt-[80px] lg:mt-[100px]">
        <TCUTabSpacer />
      </div>
    </div>
  );
}
