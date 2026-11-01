import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  caption,
  action,
  className,
  children,
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={cn("min-w-0 rounded-md border bg-card", className)}>
      <header className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-medium tracking-[-0.005em]">{title}</h2>
          {caption && <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>}
        </div>
        {action}
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}
