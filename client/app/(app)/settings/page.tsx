import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/data/page-skeleton";
import { SettingsView } from "@/components/layout/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsView />
    </Suspense>
  );
}
