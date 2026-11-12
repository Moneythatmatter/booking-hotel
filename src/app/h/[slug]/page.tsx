import { Suspense } from "react";
import { HotelPage } from "@/components/hotel-page";
import { Spinner } from "@/components/ui";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Spinner label="Loading hotel" />
        </div>
      }
    >
      <HotelPage />
    </Suspense>
  );
}
