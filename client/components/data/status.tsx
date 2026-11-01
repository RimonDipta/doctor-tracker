import { DOCTOR_STATUS_LABELS, PATIENT_STATUS_LABELS } from "@/lib/format";
import type { DoctorStatus, PatientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT = {
  active: "bg-primary",
  on_leave: "bg-warning",
  follow_up: "bg-warning",
  inactive: "bg-sage",
  discharged: "bg-sage",
} as const;

function StatusDot({ tone, label }: { tone: keyof typeof DOT; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap">
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[tone])} />
      {label}
    </span>
  );
}

export const DoctorStatusBadge = ({ status }: { status: DoctorStatus }) => (
  <StatusDot tone={status} label={DOCTOR_STATUS_LABELS[status]} />
);

export const PatientStatusBadge = ({ status }: { status: PatientStatus }) => (
  <StatusDot tone={status} label={PATIENT_STATUS_LABELS[status]} />
);
