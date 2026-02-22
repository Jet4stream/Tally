import { Suspense } from "react";
import CompleteAccountForm from "../../../components/SignupForm2";

export default function CompleteAccountPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CompleteAccountForm />
    </Suspense>
  );
}
