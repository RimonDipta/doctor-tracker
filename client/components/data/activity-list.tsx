import { ArrowRightLeft, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatRelative } from "@/lib/format";
import type { ActivityEntry } from "@/lib/types";

const ACTIONS = {
  created: { icon: Plus, verb: "Added" },
  updated: { icon: Pencil, verb: "Updated" },
  deleted: { icon: Trash2, verb: "Deleted" },
  reassigned: { icon: ArrowRightLeft, verb: "Reassigned" },
} as const;

export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ul className="space-y-3.5">
      {entries.map((entry) => {
        const { icon: Icon, verb } = ACTIONS[entry.action];
        const href =
          entry.action === "deleted"
            ? null
            : `/${entry.entityType === "doctor" ? "doctors" : "patients"}/${entry.entityId}`;
        return (
          <li key={entry.id} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Icon className="size-3" strokeWidth={2} />
            </span>
            <div className="min-w-0 text-[13px] leading-snug">
              <p className="break-words">
                {verb}{" "}
                {href ? (
                  <Link href={href} className="font-medium hover:text-primary">
                    {entry.label}
                  </Link>
                ) : (
                  <span className="font-medium">{entry.label}</span>
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {entry.detail ? `${entry.detail} · ` : ""}
                {formatRelative(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
