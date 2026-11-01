import { cn } from "@/lib/utils";

/** The mark: a "D" whose counter holds a medical cross, on a teal tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="6" fill="var(--primary)" />
      <path
        fill="#fff"
        d="M9 7h6.5a9 9 0 0 1 0 18H9V7Zm3.2 3.2v11.6h3.3a5.8 5.8 0 0 0 0-11.6h-3.3Z"
      />
      <path fill="#fff" d="M14.4 14.6h1.7v-1.7h2v1.7h1.7v2h-1.7v1.7h-2v-1.7h-1.7z" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-medium tracking-[-0.01em]">Doctor Tracker</span>
    </span>
  );
}
