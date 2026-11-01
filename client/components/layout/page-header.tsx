import type { ReactNode } from "react";

/** Editorial page heading: a short accent rule, a mono eyebrow, then the title. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-9">
      <div className="min-w-0">
        <p className="label-caps flex items-center gap-2">
          <span aria-hidden="true" className="h-px w-5 bg-primary" />
          {eyebrow}
        </p>
        <h1 className="mt-2.5 text-[26px] leading-tight font-medium tracking-[-0.022em] md:text-[32px]">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
