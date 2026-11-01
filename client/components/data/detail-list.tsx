import type { ReactNode } from "react";

/** Label/value pairs on thin rules. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="-my-2.5 divide-y">
      {items.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-6 py-2.5 text-[13px]">
          <dt className="shrink-0 text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-right break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
