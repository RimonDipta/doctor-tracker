"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { useDeletePatient } from "@/lib/queries";
import type { Patient } from "@/lib/types";

export function DeletePatientDialog({
  patient,
  onOpenChange,
  onDeleted,
}: {
  patient: Pick<Patient, "id" | "fullName"> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const remove = useDeletePatient();

  const confirm = async () => {
    if (!patient) return;
    try {
      await remove.mutateAsync(patient.id);
      toast.success(`${patient.fullName} removed`);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(patient)}
      onOpenChange={onOpenChange}
      title={`Remove ${patient?.fullName ?? "patient"}?`}
      description="Their record is deleted permanently. To move them to another doctor, edit the patient instead."
      confirmLabel="Remove patient"
      onConfirm={confirm}
      pending={remove.isPending}
    />
  );
}
