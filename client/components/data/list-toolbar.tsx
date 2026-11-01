"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

/** Local input state, committed to the URL after a pause in typing. */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft);
  const committed = useRef(value);

  useEffect(() => {
    if (debounced !== committed.current) {
      committed.current = debounced;
      onChange(debounced);
    }
  }, [debounced, onChange]);

  // The URL can change underneath us, e.g. "Clear filters".
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="pl-8"
      />
    </div>
  );
}

const ALL = "__all";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger aria-label={label} className="w-full sm:w-auto sm:min-w-40 sm:max-w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: all</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DateRangeFilter({
  label,
  from,
  to,
  onChange,
}: {
  label: string;
  from: string;
  to: string;
  onChange: (range: { from?: string; to?: string }) => void;
}) {
  return (
    <fieldset className="col-span-full flex min-w-0 items-center gap-2 sm:col-auto">
      <legend className="sr-only">{label}</legend>
      <Input
        type="date"
        aria-label={`${label} from`}
        value={from}
        max={to || undefined}
        onChange={(event) => onChange({ from: event.target.value })}
        className="min-w-0 text-[13px] sm:w-[140px]"
      />
      <span aria-hidden="true" className="text-muted-foreground">
        –
      </span>
      <Input
        type="date"
        aria-label={`${label} to`}
        value={to}
        min={from || undefined}
        onChange={(event) => onChange({ to: event.target.value })}
        className="min-w-0 text-[13px] sm:w-[140px]"
      />
    </fieldset>
  );
}

/** Filters stay inline on desktop and fold behind a button below that. */
export function ListToolbar({
  search,
  filters,
  activeFilters,
  onClear,
}: {
  search: ReactNode;
  filters: ReactNode;
  activeFilters: number;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3 border-b p-3 md:p-4">
      <div className="flex items-center gap-2">
        {search}
        <Button
          variant="outline"
          className="xl:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal />
          Filters
          {activeFilters > 0 && (
            <span className="rounded bg-accent px-1 text-[11px] text-accent-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>
      <div
        className={cn(
          "items-center gap-2 sm:flex-wrap",
          open ? "grid grid-cols-1 sm:flex" : "hidden xl:flex",
        )}
      >
        {filters}
        {activeFilters > 0 && (
          <Button variant="ghost" onClick={onClear} className="text-muted-foreground">
            <X />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
