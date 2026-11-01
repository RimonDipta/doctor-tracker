"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatMonth, formatMonthYear, plural } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" };

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const entry = payload?.[0];
  if (!active || !entry) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <p className="text-muted-foreground">{entry.payload?.tooltipLabel as string}</p>
      <p className="mt-0.5 font-medium tabular-nums">{plural(Number(entry.value), "patient")}</p>
    </div>
  );
}

const RANGES = [
  { months: 3, label: "3M" },
  { months: 6, label: "6M" },
  { months: 12, label: "12M" },
];

export function RegistrationsChart({ data }: { data: DashboardStats["registrations"] }) {
  const [months, setMonths] = useState(12);

  const rows = useMemo(
    () =>
      data.slice(-months).map((row, index, window) => {
        const last = window.length - 1;
        return {
          ...row,
          // The running month is still filling up, so it gets its own dashed
          // segment instead of reading as a sudden drop in the solid line.
          complete: index < last ? row.count : null,
          partial: index >= last - 1 ? row.count : null,
          label: formatMonth(row.month),
          tooltipLabel: index === last ? `${formatMonthYear(row.month)} so far` : formatMonthYear(row.month),
        };
      }),
    [data, months],
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="text-[22px] font-medium tracking-tight text-foreground">{total}</span>{" "}
          registered in {months} months
        </p>
        <div role="group" aria-label="Time range" className="flex rounded-md border p-0.5">
          {RANGES.map((range) => (
            <button
              key={range.months}
              type="button"
              aria-pressed={months === range.months}
              onClick={() => setMonths(range.months)}
              className={cn(
                "rounded-[4px] px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                months === range.months && "bg-accent text-accent-foreground",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div
        role="group"
        aria-label={`Patient registrations per month. ${total} over the last ${months} months.`}
        className="h-60 lg:h-[332px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} tickMargin={8} interval="preserveStartEnd" minTickGap={16} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} width={44} />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--input)" }} />
            <Area
              type="monotone"
              dataKey="complete"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="var(--chart-1)"
              fillOpacity={0.1}
              activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: "var(--chart-1)" }}
              isAnimationActive={false}
            />
            <Line
              dataKey="partial"
              type="linear"
              stroke="var(--chart-1)"
              strokeWidth={2}
              strokeDasharray="3 4"
              dot={false}
              activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: "var(--chart-1)" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Patient registrations per month</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.tooltipLabel}</th>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SEGMENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ConditionsChart({ data }: { data: DashboardStats["conditions"] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const rows = data.map((row, index) => ({
    ...row,
    tooltipLabel: row.name,
    share: total ? Math.round((row.count / total) * 100) : 0,
    color: row.name === "Other" ? "var(--chart-other)" : SEGMENT_COLORS[index],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label={`${total} patients by condition`} className="relative mx-auto size-[172px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="name"
              innerRadius={64}
              outerRadius={84}
              stroke="#fff"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {rows.map((row) => (
                <Cell key={row.name} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={ChartTooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-medium tracking-tight">{total}</span>
          <span className="text-[11px] text-muted-foreground">patients</span>
        </div>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2 text-[13px]">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ background: row.color }} />
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span className="text-muted-foreground tabular-nums">{row.count}</span>
            <span className="w-9 text-right text-muted-foreground tabular-nums">{row.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const shortName = (name: string) => (name.length > 22 ? `${name.slice(0, 21)}…` : name);

export function PatientsPerDoctorChart({ data }: { data: DashboardStats["patientsPerDoctor"] }) {
  const router = useRouter();
  const rows = data.map((row) => ({
    ...row,
    label: shortName(row.name),
    tooltipLabel: `${row.name} · ${row.specialization}`,
  }));

  return (
    <>
      <div
        role="group"
        aria-label={`Doctors with the most patients. ${rows[0]?.name} leads with ${rows[0]?.count}.`}
        style={{ height: rows.length * 36 + 8 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 32, left: 0, bottom: 4 }}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={152} tick={{ ...AXIS_TICK, fontSize: 12, fill: "var(--foreground)" }} />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--muted)", radius: 4 }} />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              barSize={12}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              cursor="pointer"
              onClick={(entry) => router.push(`/doctors/${(entry as unknown as { id: string }).id}`)}
            >
              <LabelList dataKey="count" position="right" offset={8} style={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Patients per doctor</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.name}</th>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
