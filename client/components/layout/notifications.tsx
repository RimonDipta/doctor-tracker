"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { ActivityList } from "@/components/data/activity-list";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useActivity } from "@/lib/queries";

const SEEN_KEY = "dt:activity-seen";

// Only a per-browser "seen" marker: losing it just shows the dot again.
function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function writeSeen(value: string) {
  try {
    localStorage.setItem(SEEN_KEY, value);
  } catch {}
}

export function Notifications() {
  const { data } = useActivity(8);
  const [seen, setSeen] = useState<string | null>(null);
  const latest = data?.[0]?.createdAt;

  useEffect(() => setSeen(readSeen()), []);

  const onOpenChange = (open: boolean) => {
    if (open && latest) {
      writeSeen(latest);
      setSeen(latest);
    }
  };

  const unread = Boolean(latest && (!seen || latest > seen));

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread ? "Notifications, new updates" : "Notifications"}
          className="relative"
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {unread && (
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <p className="label-caps border-b px-4 py-3">Recent updates</p>
        <div className="max-h-96 overflow-y-auto p-4">
          {data?.length ? (
            <ActivityList entries={data} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing has happened yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
