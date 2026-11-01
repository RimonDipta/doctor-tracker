"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { loginSchema, type LoginValues } from "@/lib/schemas";

// Only same-site paths: `next` comes from the URL and must not become an open redirect.
const safeDestination = (next: string | null) =>
  next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/dashboard";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/auth/login", { method: "POST", body: values });
      // A full navigation so the server layout sees the new cookie.
      window.location.assign(safeDestination(searchParams.get("next")));
    } catch (error) {
      setFormError((error as Error).message);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="mt-7 space-y-4">
      <TextField form={form} name="email" label="Email" type="email" autoComplete="username" autoFocus />
      <TextField form={form} name="password" label="Password" type="password" autoComplete="current-password" />
      {formError && (
        <p role="alert" className="rounded-md bg-destructive/8 px-3 py-2 text-[13px] text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
