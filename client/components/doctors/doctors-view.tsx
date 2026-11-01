"use client";

import { Plus, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { DateRangeFilter, FilterSelect, ListToolbar, SearchInput } from "@/components/data/list-toolbar";
import { Pagination } from "@/components/data/pagination";
import { RowActions } from "@/components/data/row-actions";
import { EmptyState, ErrorState } from "@/components/data/states";
import { UserAvatar } from "@/components/data/user-avatar";
import { DeleteDoctorDialog } from "@/components/doctors/delete-doctor-dialog";
import { DoctorFormDialog } from "@/components/doctors/doctor-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useListParams } from "@/hooks/use-list-params";
import { formatDate } from "@/lib/format";
import { useDoctorFilters, useDoctors } from "@/lib/queries";
import type { Doctor } from "@/lib/types";

const FILTER_KEYS = ["specialization", "hospital", "addedFrom", "addedTo"] as const;

export function DoctorsView() {
  const { query, update } = useListParams();
  const { data, isPending, isFetching, error, refetch } = useDoctors(query);
  const { data: filters } = useDoctorFilters();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);

  const openEdit = useCallback((doctor: Doctor) => {
    setEditing(doctor);
    setFormOpen(true);
  }, []);

  const columns = useMemo<Column<Doctor>[]>(
    () => [
      {
        key: "name",
        header: "Doctor",
        sortKey: "name",
        cell: (doctor) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={doctor.name} />
            <Link href={`/doctors/${doctor.id}`} className="font-medium hover:text-primary">
              {doctor.name}
            </Link>
          </div>
        ),
      },
      { key: "specialization", header: "Specialization", sortKey: "specialization", cell: (doctor) => doctor.specialization },
      { key: "hospital", header: "Hospital", sortKey: "hospital", className: "hidden xl:table-cell", cell: (doctor) => doctor.hospital },
      {
        key: "contact",
        header: "Contact",
        className: "hidden lg:table-cell",
        cell: (doctor) => (
          <div className="leading-tight">
            <p className="tabular-nums">{doctor.phone}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{doctor.email}</p>
          </div>
        ),
      },
      { key: "patientCount", header: "Patients", sortKey: "patientCount", firstOrder: "desc", align: "right", cell: (doctor) => <span className="tabular-nums">{doctor.patientCount}</span> },
      { key: "createdAt", header: "Added", sortKey: "createdAt", firstOrder: "desc", cell: (doctor) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDate(doctor.createdAt)}</span> },
      {
        key: "actions",
        header: "",
        align: "right",
        className: "w-12",
        cell: (doctor) => (
          <RowActions
            label={doctor.name}
            viewHref={`/doctors/${doctor.id}`}
            onEdit={() => openEdit(doctor)}
            onDelete={() => setDeleting(doctor)}
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
        eyebrow="Directory"
        title="Doctors"
        description={data ? `${data.meta.total} ${hasCriteria ? "matching" : "on record"}` : undefined}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add doctor
          </Button>
        }
      />

      <div className="rounded-md border bg-card">
        <ListToolbar
          search={
            <SearchInput
              value={query.search ?? ""}
              onChange={onSearch}
              placeholder="Search doctors"
            />
          }
          activeFilters={activeFilters}
          onClear={() => update(Object.fromEntries(FILTER_KEYS.map((key) => [key, null])))}
          filters={
            <>
              <FilterSelect
                label="Specialization"
                value={query.specialization ?? ""}
                onChange={(specialization) => update({ specialization })}
                options={(filters?.specializations ?? []).map((value) => ({ value, label: value }))}
              />
              <FilterSelect
                label="Hospital"
                value={query.hospital ?? ""}
                onChange={(hospital) => update({ hospital })}
                options={(filters?.hospitals ?? []).map((value) => ({ value, label: value }))}
              />
              <DateRangeFilter
                label="Date added"
                from={query.addedFrom ?? ""}
                to={query.addedTo ?? ""}
                onChange={({ from, to }) =>
                  update({
                    ...(from !== undefined && { addedFrom: from }),
                    ...(to !== undefined && { addedTo: to }),
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
              label="Doctors"
              columns={columns}
              rows={data?.data}
              rowKey={(doctor) => doctor.id}
              sort={query.sort ?? "createdAt"}
              order={query.order ?? "desc"}
              onSort={(sort, order) => update({ sort, order })}
              isLoading={isPending}
              isFetching={isFetching}
              empty={
                hasCriteria ? (
                  <EmptyState
                    icon={Stethoscope}
                    title="No doctors match"
                    description="Try a different search or clear the filters."
                  />
                ) : (
                  <EmptyState
                    icon={Stethoscope}
                    title="No doctors yet"
                    description="Add your first doctor to start assigning patients."
                  />
                )
              }
              mobileCard={(doctor) => (
                <div className="flex items-start gap-3">
                  <UserAvatar name={doctor.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/doctors/${doctor.id}`} className="block truncate text-sm font-medium">
                      {doctor.name}
                    </Link>
                    <p className="truncate text-[13px] text-muted-foreground">{doctor.specialization}</p>
                    <p className="truncate text-[13px] text-muted-foreground">{doctor.hospital}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                      {doctor.patientCount} patients · Added {formatDate(doctor.createdAt)}
                    </p>
                  </div>
                  <RowActions
                    label={doctor.name}
                    viewHref={`/doctors/${doctor.id}`}
                    onEdit={() => openEdit(doctor)}
                    onDelete={() => setDeleting(doctor)}
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

      <DoctorFormDialog open={formOpen} onOpenChange={setFormOpen} doctor={editing} />
      <DeleteDoctorDialog doctor={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}
