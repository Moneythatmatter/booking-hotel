import { Suspense } from "react";
import { ConfirmationPage } from "@/components/confirmation-page";
import { Spinner } from "@/components/ui";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spinner label="Loading confirmation" />
        </div>
      }
    >
      <ConfirmationPage />
    </Suspense>
  );
}
