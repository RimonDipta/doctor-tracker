import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/data/page-skeleton";
import { PatientDetailView } from "@/components/patients/patient-detail-view";

export const metadata: Metadata = { title: "Patient" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PatientDetailView />
    </Suspense>
  );
}
