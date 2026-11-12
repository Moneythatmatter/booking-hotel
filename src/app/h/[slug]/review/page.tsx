import { Suspense } from "react";
import { ReviewPage } from "@/components/review-page";
import { Spinner } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Spinner label="Preparing review" /></div>}>
      <ReviewPage />
    </Suspense>
  );
}
