"use client";

import { Pencil, Plus, Trash2, Users, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { DetailList } from "@/components/data/detail-list";
import { SearchInput } from "@/components/data/list-toolbar";
import { Pagination } from "@/components/data/pagination";
import { Panel } from "@/components/data/panel";
import { EmptyState, ErrorState } from "@/components/data/states";
import { DoctorStatusBadge, PatientStatusBadge } from "@/components/data/status";
import { UserAvatar } from "@/components/data/user-avatar";
import { DeleteDoctorDialog } from "@/components/doctors/delete-doctor-dialog";
import { DoctorFormDialog } from "@/components/doctors/doctor-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListParams } from "@/hooks/use-list-params";
import { formatDate } from "@/lib/format";
import { useDoctor, useDoctorPatients } from "@/lib/queries";
import type { Patient } from "@/lib/types";

export function DoctorDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { query, update } = useListParams();
  const doctor = useDoctor(id);
  const patients = useDoctorPatients(id, query);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<Patient | null>(null);

  const columns = useMemo<Column<Patient>[]>(
    () => [
      {
        key: "fullName",
        header: "Patient",
        sortKey: "fullName",
        cell: (patient) => (
          <Link href={`/patients/${patient.id}`} className="font-medium hover:text-primary">
            {patient.fullName}
          </Link>
        ),
      },
      { key: "condition", header: "Condition", sortKey: "condition", cell: (patient) => patient.condition },
      { key: "status", header: "Status", sortKey: "status", cell: (patient) => <PatientStatusBadge status={patient.status} /> },
      { key: "registeredAt", header: "Registered", sortKey: "registeredAt", firstOrder: "desc", cell: (patient) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDate(patient.registeredAt)}</span> },
      {
        key: "remove",
        header: "",
        align: "right",
        className: "w-12",
        cell: (patient) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${patient.fullName}`}
            onClick={() => setRemoving(patient)}
          >
            <X />
          </Button>
        ),
      },
    ],
    [],
  );

  const onSearch = useCallback((search: string) => update({ search }), [update]);
  const onPageChange = useCallback((page: number) => update({ page }), [update]);

  if (doctor.error) {
    return (
      <div className="rounded-md border bg-card">
        <ErrorState error={doctor.error} onRetry={() => doctor.refetch()} />
      </div>
    );
  }

  const data = doctor.data;

  return (
    <>
      <PageHeader
        eyebrow="Doctor"
        title={data ? data.name : <Skeleton className="h-9 w-64 bg-muted" />}
        description={data ? `${data.specialization} · ${data.hospital}` : undefined}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)} disabled={!data}>
              <Pencil /> Edit
            </Button>
            <Button
              variant="outline"
              aria-label="Delete doctor"
              onClick={() => setDeleteOpen(true)}
              disabled={!data}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Panel title="Details">
          {data ? (
            <>
              <div className="mb-5 flex items-center gap-4">
                <UserAvatar name={data.name} className="size-12 text-sm" />
                <div>
                  <p className="text-[34px] leading-none tracking-[-0.03em]">{data.patientCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.patientCount === 1 ? "patient" : "patients"}
                  </p>
                </div>
              </div>
              <DetailList
                items={[
                  { label: "Status", value: <DoctorStatusBadge status={data.status} /> },
                  { label: "Specialization", value: data.specialization },
                  { label: "Hospital", value: data.hospital },
                  { label: "Phone", value: <a href={`tel:${data.phone}`} className="hover:text-primary">{data.phone}</a> },
                  { label: "Email", value: <a href={`mailto:${data.email}`} className="hover:text-primary">{data.email}</a> },
                  { label: "Added", value: formatDate(data.createdAt) },
                ]}
              />
            </>
          ) : (
            <Skeleton className="h-64 w-full bg-muted" />
          )}
        </Panel>

        <section aria-label="Patients" className="min-w-0 rounded-md border bg-card lg:col-span-2">
          <div className="flex items-center gap-2 border-b p-3 md:p-4">
            <SearchInput value={query.search ?? ""} onChange={onSearch} placeholder="Search patients" />
            <Button onClick={() => setAddOpen(true)}>
              <Plus /> <span className="hidden sm:inline">Add patient</span>
              <span className="sr-only sm:hidden">Add patient</span>
            </Button>
          </div>
          {patients.error ? (
            <ErrorState error={patients.error} onRetry={() => patients.refetch()} />
          ) : (
            <>
              <DataTable
                label={`Patients of ${data?.name ?? "this doctor"}`}
                columns={columns}
                rows={patients.data?.data}
                rowKey={(patient) => patient.id}
                sort={query.sort ?? "registeredAt"}
                order={query.order ?? "desc"}
                onSort={(sort, order) => update({ sort, order })}
                isLoading={patients.isPending}
                isFetching={patients.isFetching}
                empty={
                  <EmptyState
                    icon={Users}
                    title={query.search ? "No patients match" : "No patients yet"}
                    description={query.search ? undefined : "Patients assigned to this doctor appear here."}
                  />
                }
                mobileCard={(patient) => (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/patients/${patient.id}`} className="block truncate text-sm font-medium">
                        {patient.fullName}
                      </Link>
                      <p className="truncate text-[13px] text-muted-foreground">{patient.condition}</p>
                      <div className="mt-1.5">
                        <PatientStatusBadge status={patient.status} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${patient.fullName}`}
                      onClick={() => setRemoving(patient)}
                    >
                      <X />
                    </Button>
                  </div>
                )}
              />
              {patients.data && patients.data.meta.total > 0 && (
                <Pagination
                  meta={patients.data.meta}
                  onPageChange={onPageChange}
                  onLimitChange={(limit) => update({ limit })}
                />
              )}
            </>
          )}
        </section>
      </div>

      <DoctorFormDialog open={editOpen} onOpenChange={setEditOpen} doctor={data} />
      <DeleteDoctorDialog
        doctor={deleteOpen ? (data ?? null) : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/doctors")}
      />
      <PatientFormDialog open={addOpen} onOpenChange={setAddOpen} doctorId={id} />
      <DeletePatientDialog
        patient={removing}
        onOpenChange={(open) => !open && setRemoving(null)}
      />
    </>
  );
}
