import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <p className="label-caps">404</p>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">This page doesn't exist</h1>
      <Button asChild className="mt-5">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
