import { AlertCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        icon={AlertCircle}
        title="That didn't load"
        description={error.message}
        action={
          onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )
        }
      />
    </div>
  );
}
