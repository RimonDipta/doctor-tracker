import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { PageSkeleton } from "@/components/data/page-skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentAdmin } from "@/lib/session";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return <AppShell admin={admin}>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1320px] p-8">
          <PageSkeleton />
        </div>
      }
    >
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
