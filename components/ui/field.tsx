import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Accessible form field wrapper: label, control, hint, and error are wired
 * together with the right `for`/`aria-describedby`/`aria-invalid` attributes.
 */
export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-base font-semibold text-sand-900">
        {label}
        {required && (
          <span className="ml-1 text-clay-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-sand-600">
          {hint}
        </p>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
