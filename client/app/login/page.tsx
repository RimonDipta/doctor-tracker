import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/layout/login-form";
import { Logo, LogoMark } from "@/components/layout/logo";
import { getCurrentAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

/** Decided here rather than in proxy.ts: a stale cookie must still reach the form. */
async function RedirectIfSignedIn() {
  if (await getCurrentAdmin()) redirect("/dashboard");
  return null;
}

function CareVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden="true">
      <div className="absolute inset-[8%] rounded-full border border-white/10" />
      <div className="absolute inset-[19%] rounded-full border border-white/10" />
      <div className="absolute inset-[30%] rounded-full border border-white/10" />
      <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(68,196,168,0.2),rgba(9,39,37,0)_68%)]" />
      <div className="absolute inset-[28%] grid place-items-center rounded-[2rem] border border-white/15 bg-white/[0.06] shadow-[0_24px_90px_rgba(0,0,0,0.2)] backdrop-blur-sm">
        <svg viewBox="0 0 160 160" fill="none" className="w-[58%]">
          <path d="M80 133S25 99 25 58C25 35 54 23 73 43L80 51L87 43C106 23 135 35 135 58C135 99 80 133 80 133Z" stroke="#9CE5D4" strokeWidth="2" />
          <path d="M24 80h34l12-24 18 49 15-25h33" stroke="#9CE5D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute left-0 top-[22%] rounded-2xl border border-white/10 bg-[#123d38]/90 px-4 py-3 shadow-xl backdrop-blur-md">
        <p className="text-[10px] tracking-[0.16em] text-white/50 uppercase">Care overview</p>
        <p className="mt-1 text-sm font-medium text-white">Connected care</p>
      </div>
      <div className="absolute bottom-[16%] right-0 rounded-2xl border border-white/10 bg-[#123d38]/90 px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#9CE5D4]" />
          <p className="text-xs text-white/75">Records, in sync</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[1fr_0.92fr]">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>

      <section className="flex min-h-dvh flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-14 xl:px-20">
        <header className="flex items-center justify-between">
          <Logo />
          <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-primary" />
            Secure admin portal
          </span>
        </header>

        <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-center py-12">
          <div className="mb-8">
            <div className="mb-5 grid size-11 place-items-center rounded-2xl border border-border bg-card shadow-sm">
              <LogoMark className="size-6" />
            </div>
            <p className="label-caps">Welcome back</p>
            <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.04em] sm:text-[36px]">
              Sign in to your practice
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              Manage your doctors and patient records from one secure workspace.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
              <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9V7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Your workspace is protected with secure authentication.
          </div>
        </div>

        <footer className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>© 2026 Doctor Tracker</span>
          <span>For authorized personnel only</span>
        </footer>
      </section>

      <aside className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-[#092e2b] px-10 py-9 text-white lg:flex xl:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(40,139,119,0.28),transparent_42%),linear-gradient(145deg,#0b3934,#082522_75%)]" />
        <div className="absolute -right-32 -top-32 size-[440px] rounded-full border border-white/[0.06]" />
        <div className="absolute -right-16 -top-16 size-[310px] rounded-full border border-white/[0.06]" />
        <div className="relative flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-white/65 uppercase">
          <span className="size-1.5 rounded-full bg-[#9CE5D4]" />
          A clearer view of care
        </div>

        <div className="relative mx-auto w-full max-w-[520px] py-10">
          <CareVisual />
          <div className="mx-auto mt-2 max-w-md text-center">
            <h2 className="text-2xl font-medium leading-snug tracking-[-0.025em] xl:text-[28px]">
              Good care starts with a connected team.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">
              Keep your practice organized, your records accessible, and your focus on people.
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-white/40">
          <span>Simple tools. Thoughtful care.</span>
          <span>01 / Workspace</span>
        </div>
      </aside>
    </main>
  );
}
