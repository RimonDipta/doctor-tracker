"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { FieldShell } from "@/components/forms/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { plural } from "@/lib/format";
import { useDeleteDoctor, useDoctorOptions } from "@/lib/queries";
import type { Doctor } from "@/lib/types";

/** Patients are never orphaned: a doctor with a panel needs a named successor. */
export function DeleteDoctorDialog({
  doctor,
  onOpenChange,
  onDeleted,
}: {
  doctor: Doctor | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const [reassignTo, setReassignTo] = useState("");
  const remove = useDeleteDoctor();
  const needsSuccessor = (doctor?.patientCount ?? 0) > 0;
  const { data: options } = useDoctorOptions(needsSuccessor);

  const close = (open: boolean) => {
    if (!open) setReassignTo("");
    onOpenChange(open);
  };

  const confirm = async () => {
    if (!doctor) return;
    try {
      await remove.mutateAsync({ id: doctor.id, reassignTo: reassignTo || undefined });
      toast.success(`${doctor.name} deleted`);
      close(false);
      onDeleted?.();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(doctor)}
      onOpenChange={close}
      title={`Delete ${doctor?.name ?? "doctor"}?`}
      description={
        needsSuccessor
          ? `${plural(doctor!.patientCount, "patient")} will move to the doctor you choose. This can't be undone.`
          : "This doctor has no patients. This can't be undone."
      }
      confirmLabel="Delete doctor"
      onConfirm={confirm}
      pending={remove.isPending}
      disabled={needsSuccessor && !reassignTo}
    >
      {needsSuccessor && (
        <FieldShell id="reassign-to" label="Move patients to">
          <Select value={reassignTo || undefined} onValueChange={setReassignTo}>
            <SelectTrigger id="reassign-to" className="w-full">
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent>
              {options
                ?.filter((option) => option.id !== doctor?.id)
                .map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} · {option.specialization}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FieldShell>
      )}
    </ConfirmDialog>
  );
}
