"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Fragment } from "react";

import { NAV_ITEMS } from "@/components/layout/nav";
import { api } from "@/lib/api";
import { keys } from "@/lib/queries";
import type { Doctor, Patient } from "@/lib/types";

function useRecordName(section: string | undefined, id: string | undefined) {
  const isDoctor = section === "doctors";
  const isPatient = section === "patients";
  const isValidRecord = Boolean(id && (isDoctor || isPatient));

  const queryKey = isDoctor ? keys.doctor(id ?? "") : keys.patient(id ?? "");

  const { data } = useQuery<Doctor | Patient>({
    queryKey,
    queryFn: () =>
      isDoctor
        ? api<Doctor>(`/doctors/${id}`)
        : api<Patient>(`/patients/${id}`),
    enabled: isValidRecord,
  });

  if (!data) return undefined;

  return "fullName" in data ? data.fullName : data.name;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();

  const section = pathname.split("/")[1];
  const item = NAV_ITEMS.find(({ href }) => href === `/${section}`);

  const recordName = useRecordName(section, params.id);

  const crumbs = [
    ...(item ? [{ href: item.href, label: item.label }] : []),
    ...(params.id ? [{ href: pathname, label: recordName ?? "Details" }] : []),
  ];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-[13px]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={crumb.href}>
              {index > 0 && (
                <li aria-hidden="true" className="text-input">
                  /
                </li>
              )}

              <li className="min-w-0 truncate">
                {isLast ? (
                  <span aria-current="page" className="font-medium">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
