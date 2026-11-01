import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/layout/login-form";
import { Logo } from "@/components/layout/logo";
import { getCurrentAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

/** Decided here rather than in proxy.ts: a stale cookie must still reach the form. */
async function RedirectIfSignedIn() {
  if (await getCurrentAdmin()) redirect("/dashboard");
  return null;
}

/** A quiet ECG trace, drawn once across the panel. */
function Trace() {
  return (
    <svg viewBox="0 0 640 120" fill="none" aria-hidden="true" className="w-full">
      <path
        d="M0 60h196l14-8 12 8h20l10 10 16-62 18 88 12-36h34l18-14 20 14H640"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="flex flex-col p-6 md:p-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-[340px] flex-1 flex-col justify-center py-10">
          <p className="label-caps flex items-center gap-2">
            <span aria-hidden="true" className="h-px w-5 bg-primary" />
            Administrators
          </p>
          <h1 className="mt-2.5 text-[28px] leading-tight font-medium tracking-[-0.022em]">
            Sign in to your practice
          </h1>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <div className="hidden flex-col justify-between border-l bg-accent/60 p-10 lg:flex">
        <p className="label-caps">Doctor Tracker</p>
        <div>
          <Trace />
          <p className="mt-10 max-w-md text-[28px] leading-[1.25] font-normal tracking-[-0.02em]">
            Every doctor, every patient, one calm record of who is looking after whom.
          </p>
        </div>
      </div>
    </main>
  );
}
