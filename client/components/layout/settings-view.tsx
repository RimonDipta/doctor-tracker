"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors, TextField } from "@/components/forms/field";
import { useCurrentAdmin, useSetCurrentAdmin } from "@/components/layout/admin-context";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/data/panel";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  passwordSchema,
  profileSchema,
  type PasswordValues,
  type ProfileValues,
} from "@/lib/schemas";
import type { Admin } from "@/lib/types";

function ProfileForm() {
  const admin = useCurrentAdmin();
  const setAdmin = useSetCurrentAdmin();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: admin.name, email: admin.email },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const updated = await api<Admin>("/auth/me", { method: "PATCH", body: values });
      setAdmin(updated);
      form.reset(values);
      toast.success("Profile updated");
    } catch (error) {
      if (!applyServerErrors(form, error)) toast.error((error as Error).message);
    }
  });

  return (
    <Panel title="Profile" caption="How you appear in the activity log.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField form={form} name="name" label="Name" autoComplete="name" />
        <TextField form={form} name="email" label="Email" type="email" autoComplete="email" />
        <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
          Save changes
        </Button>
      </form>
    </Panel>
  );
}

function PasswordForm() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const submit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await api<void>("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      form.reset();
      toast.success("Password changed. Other devices were signed out.");
    } catch (error) {
      if (!applyServerErrors(form, error)) toast.error((error as Error).message);
    }
  });

  return (
    <Panel title="Password" caption="Changing it signs out every other device.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField form={form} name="currentPassword" label="Current password" type="password" autoComplete="current-password" />
        <TextField form={form} name="newPassword" label="New password" type="password" autoComplete="new-password" hint="At least 10 characters." />
        <TextField form={form} name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" />
        <Button type="submit" variant="outline" disabled={form.formState.isSubmitting}>
          Change password
        </Button>
      </form>
    </Panel>
  );
}

export function SettingsView() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <div className="grid max-w-4xl items-start gap-4 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </>
  );
}
