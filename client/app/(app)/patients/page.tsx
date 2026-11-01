import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/data/page-skeleton";
import { PatientsView } from "@/components/patients/patients-view";

export const metadata: Metadata = { title: "Patients" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PatientsView />
    </Suspense>
  );
}
