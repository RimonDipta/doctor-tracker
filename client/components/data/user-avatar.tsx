import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium tracking-wide text-accent-foreground",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
