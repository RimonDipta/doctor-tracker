"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <p className="label-caps">Service unavailable</p>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">We can't reach Doctor Tracker</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The API isn't responding. Your data is safe; try again in a moment.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
