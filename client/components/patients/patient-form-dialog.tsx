"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
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
import { GENDER_LABELS, PATIENT_STATUS_LABELS, toDateInput, toOptions } from "@/lib/format";
import { useDoctorOptions, usePatientFilters, useSavePatient } from "@/lib/queries";
import { patientSchema, type PatientValues } from "@/lib/schemas";
import type { Patient } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

const toValues = (patient?: Patient | null, doctorId = ""): PatientValues =>
  patient
    ? {
        fullName: patient.fullName,
        dateOfBirth: toDateInput(patient.dateOfBirth),
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        condition: patient.condition,
        status: patient.status,
        registeredAt: toDateInput(patient.registeredAt),
        doctor: patient.doctor?.id ?? "",
      }
    : {
        fullName: "",
        dateOfBirth: "",
        // Left empty on purpose; the form requires a choice.
        gender: "" as PatientValues["gender"],
        phone: "",
        email: "",
        address: "",
        condition: "",
        status: "active",
        registeredAt: today(),
        doctor: doctorId,
      };

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  doctorId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  /** Pre-selects the doctor when adding from a doctor's page. */
  doctorId?: string;
}) {
  const form = useForm<PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: toValues(null, doctorId),
  });
  const save = useSavePatient(patient?.id);
  const { data: doctors } = useDoctorOptions(open);
  const { data: filters } = usePatientFilters();

  const doctorOptions = useMemo(
    () =>
      doctors?.map((doctor) => ({
        value: doctor.id,
        label: `${doctor.name} · ${doctor.specialization}`,
      })) ?? [],
    [doctors],
  );

  useEffect(() => {
    if (open) form.reset(toValues(patient, doctorId));
  }, [open, patient, doctorId, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      toast.success(patient ? "Patient updated" : `${saved.fullName} added`);
      onOpenChange(false);
    } catch (error) {
      if (!applyServerErrors(form, error)) toast.error((error as Error).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{patient ? "Edit patient" : "Add patient"}</DialogTitle>
          <DialogDescription>
            Administrative details only. Clinical notes don't belong here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField form={form} name="fullName" label="Full name" autoComplete="off" className="sm:col-span-2" />
            <SelectField control={form.control} name="doctor" label="Assigned doctor" options={doctorOptions} placeholder="Choose a doctor" className="sm:col-span-2" />
            <TextField form={form} name="dateOfBirth" label="Date of birth" type="date" max={today()} />
            <SelectField control={form.control} name="gender" label="Gender" options={toOptions(GENDER_LABELS)} />
            <TextField form={form} name="phone" label="Phone" type="tel" inputMode="tel" autoComplete="off" />
            <TextField form={form} name="email" label="Email" optional type="email" inputMode="email" autoComplete="off" />
            <TextField form={form} name="address" label="Address" autoComplete="off" className="sm:col-span-2" />
            <TextField form={form} name="condition" label="Medical condition" list="condition-options" autoComplete="off" />
            <datalist id="condition-options">
              {filters?.conditions.map((value) => <option key={value} value={value} />)}
            </datalist>
            <SelectField control={form.control} name="status" label="Status" options={toOptions(PATIENT_STATUS_LABELS)} />
            <TextField form={form} name="registeredAt" label="Registration date" type="date" max={today()} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : patient ? "Save changes" : "Add patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
