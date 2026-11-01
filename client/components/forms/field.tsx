"use client";

import type { ComponentProps } from "react";
import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function FieldShell({
  id,
  label,
  optional,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: FieldError;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground">Optional</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

type TextFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  optional?: boolean;
  hint?: string;
  className?: string;
} & Omit<ComponentProps<typeof Input>, "form" | "name">;

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  optional,
  hint,
  className,
  ...inputProps
}: TextFieldProps<T>) {
  const error = form.formState.errors[name] as FieldError | undefined;
  return (
    <FieldShell id={name} label={label} optional={optional} error={error} hint={hint} className={className}>
      <Input
        id={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...inputProps}
        {...form.register(name)}
      />
    </FieldShell>
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  className,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell id={name} label={label} error={fieldState.error} className={className}>
          <Select value={field.value || undefined} onValueChange={field.onChange}>
            <SelectTrigger
              id={name}
              ref={field.ref}
              aria-invalid={fieldState.invalid}
              className="w-full"
            >
              <SelectValue placeholder={placeholder ?? "Select"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      )}
    />
  );
}

/** Puts server-side field errors on their inputs. Returns false if there were none. */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, error: unknown) {
  const fieldErrors = error instanceof ApiError ? error.details?.fieldErrors : undefined;
  if (!fieldErrors) return false;
  let applied = false;
  for (const [field, message] of Object.entries(fieldErrors)) {
    if (field in form.getValues()) {
      form.setError(field as FieldPath<T>, { message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
