import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/data/page-skeleton";
import { DoctorsView } from "@/components/doctors/doctors-view";

export const metadata: Metadata = { title: "Doctors" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DoctorsView />
    </Suspense>
  );
}
