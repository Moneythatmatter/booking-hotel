import { Suspense } from "react";
import { CheckoutPage } from "@/components/checkout-page";
import { Spinner } from "@/components/ui";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spinner label="Preparing checkout" />
        </div>
      }
    >
      <CheckoutPage />
    </Suspense>
  );
}
