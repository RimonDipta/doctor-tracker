"use client";

import { Loader2, Search, Stethoscope, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGlobalSearch } from "@/lib/queries";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term.trim(), 200);
  const { data, isFetching } = useGlobalSearch(debounced);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setTerm("");
    router.push(href);
  };

  const hasResults = Boolean(data && (data.doctors.length || data.patients.length));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-sage focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:w-64"
      >
        <Search className="size-4" strokeWidth={1.75} />
        <span className="sr-only md:not-sr-only">Search</span>
        <kbd className="ml-auto hidden font-mono text-[11px] md:block">Ctrl K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="top-[15%] translate-y-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search doctors and patients by name, condition or contact details.
          </DialogDescription>
          <Command shouldFilter={false}>
            <CommandInput
              value={term}
              onValueChange={setTerm}
              placeholder="Search doctors and patients…"
            />
            <CommandList>
              {debounced.length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Type at least two characters.
                </p>
              ) : isFetching && !hasResults ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CommandEmpty>No matches for “{debounced}”.</CommandEmpty>
              )}
              {debounced.length >= 2 && !!data?.doctors.length && (
                <CommandGroup heading="Doctors">
                  {data.doctors.map((doctor) => (
                    <CommandItem
                      key={doctor.id}
                      value={`doctor-${doctor.id}`}
                      onSelect={() => go(`/doctors/${doctor.id}`)}
                    >
                      <Stethoscope className="text-muted-foreground" strokeWidth={1.75} />
                      <span className="truncate">{doctor.name}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {doctor.subtitle}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {debounced.length >= 2 && !!data?.patients.length && (
                <CommandGroup heading="Patients">
                  {data.patients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={`patient-${patient.id}`}
                      onSelect={() => go(`/patients/${patient.id}`)}
                    >
                      <User className="text-muted-foreground" strokeWidth={1.75} />
                      <span className="truncate">{patient.name}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {patient.subtitle}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
