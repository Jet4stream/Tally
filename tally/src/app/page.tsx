import NavBar from "@/app/components/NavBar";
import TabSpacer from "@/app/components/TabSpacer";
import NewReimbursementButton from "@/app/components/NewReimbursementButton";

export default function Page() {
  return (
    <div>
      <NavBar />
      <div className="mt-[64px] sm:mt-[80px] lg:mt-[100px]">
        <TabSpacer />
        <div className="px-4 sm:px-6 lg:px-[32px] mt-4">
          <NewReimbursementButton />
        </div>
      </div>
    </div>
  );
}