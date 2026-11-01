"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Server-side sort key; omit for columns that can't be sorted. */
  sortKey?: string;
  /** Direction used on the first click; dates and counts read best descending. */
  firstOrder?: "asc" | "desc";
  align?: "left" | "right";
  className?: string;
  cell: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  label: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  /** Wide tables collapse into these cards on phones. */
  mobileCard: (row: T) => ReactNode;
  sort?: string;
  order?: string;
  onSort?: (sort: string, order: "asc" | "desc") => void;
  isLoading?: boolean;
  isFetching?: boolean;
  empty: ReactNode;
}

const SKELETON_ROWS = 6;

export function DataTable<T>({
  label,
  columns,
  rows,
  rowKey,
  mobileCard,
  sort,
  order,
  onSort,
  isLoading,
  isFetching,
  empty,
}: DataTableProps<T>) {
  if (!isLoading && rows?.length === 0) return <>{empty}</>;

  const toggleSort = (column: Column<T>) => {
    if (!column.sortKey || !onSort) return;
    const first = column.firstOrder ?? "asc";
    const next = sort !== column.sortKey ? first : order === "asc" ? "desc" : "asc";
    onSort(column.sortKey, next);
  };

  return (
    <div
      aria-busy={isFetching}
      className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}
    >
      <div className="hidden md:block">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => {
                const active = column.sortKey && sort === column.sortKey;
                const Icon = !active ? ChevronsUpDown : order === "asc" ? ArrowUp : ArrowDown;
                return (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      active ? (order === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "h-10 px-3 font-normal lg:px-4",
                      column.align === "right" && "text-right",
                      column.className,
                    )}
                  >
                    {column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className="label-caps -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {column.header}
                        <Icon className={cn("size-3", !active && "opacity-40")} />
                      </button>
                    ) : (
                      <span className="label-caps">{column.header}</span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className="h-[54px] px-3 lg:px-4">
                        <Skeleton className="h-3.5 w-3/4 bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows?.map((row) => (
                  <TableRow key={rowKey(row)} className="hover:bg-[#fbfbf8]">
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "h-[54px] px-3 text-[13px] lg:px-4",
                          column.align === "right" && "text-right",
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <ul aria-label={label} className="divide-y md:hidden">
        {isLoading
          ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <li key={index} className="space-y-2 p-4">
                <Skeleton className="h-4 w-1/2 bg-muted" />
                <Skeleton className="h-3 w-3/4 bg-muted" />
              </li>
            ))
          : rows?.map((row) => (
              <li key={rowKey(row)} className="p-4">
                {mobileCard(row)}
              </li>
            ))}
      </ul>
    </div>
  );
}
