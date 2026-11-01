"use client";

import { Plus, Stethoscope, Users } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActivityList } from "@/components/data/activity-list";
import { Panel } from "@/components/data/panel";
import { EmptyState, ErrorState } from "@/components/data/states";
import { UserAvatar } from "@/components/data/user-avatar";
import { MetricStrip, MetricStripSkeleton } from "@/components/dashboard/metric-strip";
import { DoctorFormDialog } from "@/components/doctors/doctor-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMonthYear } from "@/lib/format";
import { useDashboard } from "@/lib/queries";

const ChartFallback = ({ height = 280 }: { height?: number }) => (
  <Skeleton className="w-full bg-muted" style={{ height }} />
);

// Recharts is the heaviest dependency here, and only this page needs it.
const RegistrationsChart = dynamic(
  () => import("./charts").then((module) => module.RegistrationsChart),
  { ssr: false, loading: () => <ChartFallback /> },
);
const ConditionsChart = dynamic(
  () => import("./charts").then((module) => module.ConditionsChart),
  { ssr: false, loading: () => <ChartFallback /> },
);
const PatientsPerDoctorChart = dynamic(
  () => import("./charts").then((module) => module.PatientsPerDoctorChart),
  { ssr: false, loading: () => <ChartFallback height={300} /> },
);

const SeeAll = ({ href }: { href: string }) => (
  <Link href={href} className="text-xs whitespace-nowrap text-muted-foreground hover:text-foreground">
    View all
  </Link>
);

export function DashboardView() {
  const router = useRouter();
  const { data, isPending, error, refetch } = useDashboard();
  const [dialog, setDialog] = useState<"doctor" | "patient" | null>(null);

  const eyebrow = data?.registrations.length
    ? `Overview · ${formatMonthYear(data.registrations.at(-1)!.month)}`
    : "Overview";

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Practice at a glance"
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog("doctor")}>
              <Plus /> Add doctor
            </Button>
            <Button onClick={() => setDialog("patient")}>
              <Plus /> Add patient
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-md border bg-card">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="space-y-4">
          {isPending ? <MetricStripSkeleton /> : <MetricStrip metrics={data.metrics} />}

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="Patient registrations"
              caption="Per month. Dashed: month in progress"
              className="lg:col-span-2"
            >
              {isPending ? <ChartFallback /> : <RegistrationsChart data={data.registrations} />}
            </Panel>
            <Panel title="Conditions" caption="Share of all patients">
              {isPending ? (
                <ChartFallback />
              ) : data.conditions.length ? (
                <ConditionsChart data={data.conditions} />
              ) : (
                <EmptyState icon={Users} title="No patients yet" />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Patients per doctor" caption="The eight largest panels" className="lg:col-span-2">
              {isPending ? (
                <ChartFallback height={300} />
              ) : data.patientsPerDoctor.length ? (
                <PatientsPerDoctorChart data={data.patientsPerDoctor} />
              ) : (
                <EmptyState icon={Stethoscope} title="No patients assigned yet" />
              )}
            </Panel>
            <Panel title="Recent updates">
              {isPending ? (
                <ChartFallback height={300} />
              ) : data.activity.length ? (
                <ActivityList entries={data.activity} />
              ) : (
                <p className="text-[13px] text-muted-foreground">Changes will show up here.</p>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Recent registrations" action={<SeeAll href="/patients" />}>
              {isPending ? (
                <ChartFallback height={200} />
              ) : (
                <ul className="-my-2.5 divide-y">
                  {data.recentPatients.map((patient) => (
                    <li key={patient.id} className="flex items-center gap-3 py-2.5">
                      <UserAvatar name={patient.fullName} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="block truncate text-[13px] font-medium hover:text-primary"
                        >
                          {patient.fullName}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {patient.condition}
                          {patient.doctorName && ` · ${patient.doctorName}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatDate(patient.registeredAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Recently added doctors" action={<SeeAll href="/doctors" />}>
              {isPending ? (
                <ChartFallback height={200} />
              ) : (
                <ul className="-my-2.5 divide-y">
                  {data.recentDoctors.map((doctor) => (
                    <li key={doctor.id} className="flex items-center gap-3 py-2.5">
                      <UserAvatar name={doctor.name} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/doctors/${doctor.id}`}
                          className="block truncate text-[13px] font-medium hover:text-primary"
                        >
                          {doctor.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{doctor.specialization}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatDate(doctor.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}

      <DoctorFormDialog
        open={dialog === "doctor"}
        onOpenChange={(open) => setDialog(open ? "doctor" : null)}
        onCreated={(doctor) => router.push(`/doctors/${doctor.id}`)}
      />
      <PatientFormDialog
        open={dialog === "patient"}
        onOpenChange={(open) => setDialog(open ? "patient" : null)}
      />
    </>
  );
}
