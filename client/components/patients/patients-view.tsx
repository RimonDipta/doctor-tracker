"use client";

import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { DateRangeFilter, FilterSelect, ListToolbar, SearchInput } from "@/components/data/list-toolbar";
import { Pagination } from "@/components/data/pagination";
import { RowActions } from "@/components/data/row-actions";
import { EmptyState, ErrorState } from "@/components/data/states";
import { PatientStatusBadge } from "@/components/data/status";
import { PageHeader } from "@/components/layout/page-header";
import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { Button } from "@/components/ui/button";
import { useListParams } from "@/hooks/use-list-params";
import { formatDate, PATIENT_STATUS_LABELS, toOptions } from "@/lib/format";
import { useDoctorOptions, usePatientFilters, usePatients } from "@/lib/queries";
import type { Patient } from "@/lib/types";

const FILTER_KEYS = ["doctor", "condition", "status", "registeredFrom", "registeredTo"] as const;
const STATUS_OPTIONS = toOptions(PATIENT_STATUS_LABELS);

export function PatientsView() {
  const { query, update } = useListParams();
  const { data, isPending, isFetching, error, refetch } = usePatients(query);
  const { data: filters } = usePatientFilters();
  const { data: doctors } = useDoctorOptions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const openEdit = useCallback((patient: Patient) => {
    setEditing(patient);
    setFormOpen(true);
  }, []);

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
      {
        key: "doctor",
        header: "Doctor",
        sortKey: "doctor",
        cell: (patient) =>
          patient.doctor && (
            <Link href={`/doctors/${patient.doctor.id}`} className="hover:text-primary">
              {patient.doctor.name}
            </Link>
          ),
      },
      { key: "condition", header: "Condition", sortKey: "condition", cell: (patient) => patient.condition },
      {
        key: "contact",
        header: "Contact",
        className: "hidden xl:table-cell",
        cell: (patient) => (
          <div className="leading-tight">
            <p className="tabular-nums">{patient.phone}</p>
            {patient.email && <p className="mt-0.5 text-xs text-muted-foreground">{patient.email}</p>}
          </div>
        ),
      },
      { key: "registeredAt", header: "Registered", sortKey: "registeredAt", firstOrder: "desc", cell: (patient) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDate(patient.registeredAt)}</span> },
      { key: "status", header: "Status", sortKey: "status", cell: (patient) => <PatientStatusBadge status={patient.status} /> },
      {
        key: "actions",
        header: "",
        align: "right",
        className: "w-12",
        cell: (patient) => (
          <RowActions
            label={patient.fullName}
            viewHref={`/patients/${patient.id}`}
            onEdit={() => openEdit(patient)}
            onDelete={() => setDeleting(patient)}
          />
        ),
      },
    ],
    [openEdit],
  );

  const onSearch = useCallback((search: string) => update({ search }), [update]);
  const onPageChange = useCallback((page: number) => update({ page }), [update]);
  const activeFilters = FILTER_KEYS.filter((key) => query[key]).length;
  const hasCriteria = activeFilters > 0 || Boolean(query.search);

  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Patients"
        description={data ? `${data.meta.total} ${hasCriteria ? "matching" : "on record"}` : undefined}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add patient
          </Button>
        }
      />

      <div className="rounded-md border bg-card">
        <ListToolbar
          search={
            <SearchInput
              value={query.search ?? ""}
              onChange={onSearch}
              placeholder="Search patients"
            />
          }
          activeFilters={activeFilters}
          onClear={() => update(Object.fromEntries(FILTER_KEYS.map((key) => [key, null])))}
          filters={
            <>
              <FilterSelect
                label="Doctor"
                value={query.doctor ?? ""}
                onChange={(doctor) => update({ doctor })}
                options={(doctors ?? []).map((doctor) => ({ value: doctor.id, label: doctor.name }))}
              />
              <FilterSelect
                label="Condition"
                value={query.condition ?? ""}
                onChange={(condition) => update({ condition })}
                options={(filters?.conditions ?? []).map((value) => ({ value, label: value }))}
              />
              <FilterSelect
                label="Status"
                value={query.status ?? ""}
                onChange={(status) => update({ status })}
                options={STATUS_OPTIONS}
              />
              <DateRangeFilter
                label="Registration date"
                from={query.registeredFrom ?? ""}
                to={query.registeredTo ?? ""}
                onChange={({ from, to }) =>
                  update({
                    ...(from !== undefined && { registeredFrom: from }),
                    ...(to !== undefined && { registeredTo: to }),
                  })
                }
              />
            </>
          }
        />
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <>
            <DataTable
              label="Patients"
              columns={columns}
              rows={data?.data}
              rowKey={(patient) => patient.id}
              sort={query.sort ?? "registeredAt"}
              order={query.order ?? "desc"}
              onSort={(sort, order) => update({ sort, order })}
              isLoading={isPending}
              isFetching={isFetching}
              empty={
                <EmptyState
                  icon={Users}
                  title={hasCriteria ? "No patients match" : "No patients yet"}
                  description={
                    hasCriteria
                      ? "Try a different search or clear the filters."
                      : "Add a patient and assign them to a doctor."
                  }
                />
              }
              mobileCard={(patient) => (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/patients/${patient.id}`} className="block truncate text-sm font-medium">
                      {patient.fullName}
                    </Link>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {patient.condition}
                      {patient.doctor && ` · ${patient.doctor.name}`}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground tabular-nums">{patient.phone}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <PatientStatusBadge status={patient.status} />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(patient.registeredAt)}
                      </span>
                    </div>
                  </div>
                  <RowActions
                    label={patient.fullName}
                    viewHref={`/patients/${patient.id}`}
                    onEdit={() => openEdit(patient)}
                    onDelete={() => setDeleting(patient)}
                  />
                </div>
              )}
            />
            {data && data.meta.total > 0 && (
              <Pagination
                meta={data.meta}
                onPageChange={onPageChange}
                onLimitChange={(limit) => update({ limit })}
              />
            )}
          </>
        )}
      </div>

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} patient={editing} />
      <DeletePatientDialog patient={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}
