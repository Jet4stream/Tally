import NavBar from "@/app/components/NavBar";
import TabSpacer from "@/app/components/TabSpacer";

export default function Page() {
  return (
    <div>
      <NavBar />
      <div className="mt-[64px] sm:mt-[80px] lg:mt-[100px]">
        <TabSpacer />
      </div>
    </div>
  );
}