"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DetailList } from "@/components/data/detail-list";
import { Panel } from "@/components/data/panel";
import { ErrorState } from "@/components/data/states";
import { UserAvatar } from "@/components/data/user-avatar";
import { PageHeader } from "@/components/layout/page-header";
import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ageFrom, formatDate, GENDER_LABELS, PATIENT_STATUS_LABELS, toOptions } from "@/lib/format";
import { usePatient, useUpdatePatientStatus } from "@/lib/queries";
import type { PatientStatus } from "@/lib/types";

export function PatientDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, refetch } = usePatient(id);
  const updateStatus = useUpdatePatientStatus(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (error) {
    return (
      <div className="rounded-md border bg-card">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  const changeStatus = (status: string) =>
    updateStatus.mutate(status as PatientStatus, {
      onError: (mutationError) => toast.error(mutationError.message),
    });

  return (
    <>
      <PageHeader
        eyebrow="Patient"
        title={data ? data.fullName : <Skeleton className="h-9 w-64 bg-muted" />}
        description={data?.condition}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)} disabled={!data}>
              <Pencil /> Edit
            </Button>
            <Button
              variant="outline"
              aria-label="Delete patient"
              onClick={() => setDeleteOpen(true)}
              disabled={!data}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </>
        }
      />

      {data ? (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Panel title="Personal details" className="lg:col-span-2">
            <DetailList
              items={[
                { label: "Date of birth", value: `${formatDate(data.dateOfBirth)} (age ${ageFrom(data.dateOfBirth)})` },
                { label: "Gender", value: GENDER_LABELS[data.gender] },
                { label: "Phone", value: <a href={`tel:${data.phone}`} className="hover:text-primary">{data.phone}</a> },
                {
                  label: "Email",
                  value: data.email ? (
                    <a href={`mailto:${data.email}`} className="hover:text-primary">{data.email}</a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  ),
                },
                { label: "Address", value: data.address },
                { label: "Medical condition", value: data.condition },
                { label: "Registered", value: formatDate(data.registeredAt) },
              ]}
            />
          </Panel>
          <div className="space-y-4">
            <Panel title="Status">
              <Select value={data.status} onValueChange={changeStatus}>
                <SelectTrigger aria-label="Patient status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toOptions(PATIENT_STATUS_LABELS).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Panel>
            <Panel title="Assigned doctor">
              {data.doctor ? (
                <div className="flex items-center gap-3">
                  <UserAvatar name={data.doctor.name} />
                  <div className="min-w-0">
                    <Link href={`/doctors/${data.doctor.id}`} className="block truncate text-[13px] font-medium hover:text-primary">
                      {data.doctor.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{data.doctor.specialization}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">Unassigned</p>
              )}
            </Panel>
          </div>
        </div>
      ) : (
        <Skeleton className="h-80 w-full bg-muted" />
      )}

      <PatientFormDialog open={editOpen} onOpenChange={setEditOpen} patient={data} />
      <DeletePatientDialog
        patient={deleteOpen ? (data ?? null) : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/patients")}
      />
    </>
  );
}
