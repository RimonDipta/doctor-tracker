"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors, SelectField, TextField } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOCTOR_STATUS_LABELS, toOptions } from "@/lib/format";
import { useDoctorFilters, useSaveDoctor } from "@/lib/queries";
import { doctorSchema, type DoctorValues } from "@/lib/schemas";
import type { Doctor } from "@/lib/types";

const blank: DoctorValues = {
  name: "",
  specialization: "",
  hospital: "",
  phone: "",
  email: "",
  status: "active",
};

const toValues = (doctor?: Doctor | null): DoctorValues =>
  doctor
    ? {
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        phone: doctor.phone,
        email: doctor.email,
        status: doctor.status,
      }
    : blank;

export function DoctorFormDialog({
  open,
  onOpenChange,
  doctor,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor | null;
  onCreated?: (doctor: Doctor) => void;
}) {
  const form = useForm<DoctorValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: blank,
  });
  const save = useSaveDoctor(doctor?.id);
  const { data: filters } = useDoctorFilters();

  useEffect(() => {
    if (open) form.reset(toValues(doctor));
  }, [open, doctor, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      toast.success(doctor ? "Doctor updated" : `${saved.name} added`);
      onOpenChange(false);
      if (!doctor) onCreated?.(saved);
    } catch (error) {
      if (!applyServerErrors(form, error)) toast.error((error as Error).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{doctor ? "Edit doctor" : "Add doctor"}</DialogTitle>
          <DialogDescription>
            {doctor ? "Changes apply straight away." : "They'll be available for patient assignment."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField form={form} name="name" label="Full name" placeholder="Dr. Jane Doe" autoComplete="off" className="sm:col-span-2" />
            <TextField form={form} name="specialization" label="Specialization" list="specialization-options" autoComplete="off" />
            <datalist id="specialization-options">
              {filters?.specializations.map((value) => <option key={value} value={value} />)}
            </datalist>
            <TextField form={form} name="hospital" label="Hospital" list="hospital-options" autoComplete="off" />
            <datalist id="hospital-options">
              {filters?.hospitals.map((value) => <option key={value} value={value} />)}
            </datalist>
            <TextField form={form} name="phone" label="Phone" type="tel" inputMode="tel" autoComplete="off" />
            <TextField form={form} name="email" label="Email" type="email" inputMode="email" autoComplete="off" />
            <SelectField control={form.control} name="status" label="Status" options={toOptions(DOCTOR_STATUS_LABELS)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : doctor ? "Save changes" : "Add doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
