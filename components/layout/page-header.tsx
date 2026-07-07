import type { ReactNode } from "react";

/** Consistent page title block used at the top of every app page. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-sand-950">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-lg text-sand-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
