import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/data/page-skeleton";
import { DoctorDetailView } from "@/components/doctors/doctor-detail-view";

export const metadata: Metadata = { title: "Doctor" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DoctorDetailView />
    </Suspense>
  );
}
