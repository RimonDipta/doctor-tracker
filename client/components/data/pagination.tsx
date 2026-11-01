"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageMeta } from "@/lib/types";

const PAGE_SIZES = ["10", "20", "50"];

export function Pagination({
  meta,
  onPageChange,
  onLimitChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: string) => void;
}) {
  const { page, limit, total, totalPages } = meta;

  // Deleting the last row of the last page leaves the URL pointing past the end.
  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);

  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-[13px] text-muted-foreground"
    >
      <p aria-live="polite">
        <span className="font-medium text-foreground tabular-nums">
          {first}–{last}
        </span>{" "}
        of <span className="tabular-nums">{total}</span>
      </p>
      <div className="flex items-center gap-3">
        <label className="hidden items-center gap-2 sm:flex">
          <span>Rows</span>
          <Select value={String(limit)} onValueChange={onLimitChange}>
            <SelectTrigger size="sm" aria-label="Rows per page" className="w-[68px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <span className="tabular-nums">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </nav>
  );
}
