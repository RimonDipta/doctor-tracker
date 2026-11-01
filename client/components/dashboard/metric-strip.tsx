import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

const FRAME = "grid grid-cols-2 rounded-md border bg-card lg:grid-cols-4";
// Hairlines between cells in the 2×2 phone grid and the single desktop row.
const CELL =
  "nth-[-n+2]:border-b even:border-l lg:nth-[-n+2]:border-b-0 lg:not-first:border-l";

function Trend({ direction, children }: { direction: "up" | "down" | "flat"; children: React.ReactNode }) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  return (
    <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-px size-3.5 shrink-0",
          direction === "up" && "text-primary",
          direction === "down" && "text-warning",
        )}
      />
      <span>{children}</span>
    </p>
  );
}

function Metric({ label, value, children }: { label: string; value: number; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0 p-4 md:p-5", CELL)}>
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-2.5 text-[34px] leading-none font-normal tracking-[-0.03em] md:text-[40px]">
        {value.toLocaleString("en-US")}
      </p>
      {children}
    </div>
  );
}

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));
const directionOf = (value: number | null) =>
  !value ? "flat" : value > 0 ? "up" : "down";

/** One ruled band rather than four boxes, so the numbers read as a single sentence. */
export function MetricStrip({ metrics }: { metrics: DashboardStats["metrics"] }) {
  const { totalDoctors, totalPatients, activeDoctors, newPatients } = metrics;
  return (
    <section aria-label="Key metrics" className={FRAME}>
      <Metric label="Total doctors" value={totalDoctors.value}>
        <Trend direction={directionOf(totalDoctors.addedThisMonth)}>
          {totalDoctors.addedThisMonth
            ? `${signed(totalDoctors.addedThisMonth)} this month`
            : "None added this month"}
        </Trend>
      </Metric>
      <Metric label="Total patients" value={totalPatients.value}>
        <Trend direction={directionOf(totalPatients.addedThisMonth)}>
          {totalPatients.changePct !== null
            ? `${signed(totalPatients.changePct)}% since last month`
            : `${signed(totalPatients.addedThisMonth)} this month`}
        </Trend>
      </Metric>
      <Metric label="Active doctors" value={activeDoctors.value}>
        <div
          aria-hidden="true"
          className="mt-3.5 h-0.5 w-full max-w-28 overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full bg-primary" style={{ width: `${activeDoctors.sharePct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{activeDoctors.sharePct}% of all doctors</p>
      </Metric>
      <Metric label="New patients this month" value={newPatients.value}>
        <Trend direction={directionOf(newPatients.changePct)}>
          {newPatients.changePct !== null
            ? `${signed(newPatients.changePct)}% vs same point last month`
            : "Nothing to compare yet"}
        </Trend>
      </Metric>
    </section>
  );
}

export function MetricStripSkeleton() {
  return (
    <div className={FRAME}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={cn("space-y-3 p-4 md:p-5", CELL)}>
          <Skeleton className="h-3 w-24 bg-muted" />
          <Skeleton className="h-9 w-16 bg-muted" />
          <Skeleton className="h-3 w-28 bg-muted" />
        </div>
      ))}
    </div>
  );
}
