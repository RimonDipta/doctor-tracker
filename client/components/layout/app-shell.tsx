"use client";

import type { ReactNode } from "react";
import { AdminProvider } from "@/components/layout/admin-context";
import { BottomNav, Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Admin } from "@/lib/types";

export function AppShell({ admin, children }: { admin: Admin; children: ReactNode }) {
  return (
    <AdminProvider initial={admin}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-col md:pl-16 lg:pl-56">
        <Topbar />
        <main
          id="main"
          className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-9 md:pb-12"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </AdminProvider>
  );
}
