import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="h-3 w-24 bg-muted" />
      <Skeleton className="h-9 w-56 bg-muted" />
      <Skeleton className="mt-8 h-80 w-full bg-muted" />
    </div>
  );
}
