import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-sage-600 text-white shadow-soft hover:bg-sage-700 hover:shadow-lifted active:bg-sage-800",
  secondary:
    "border border-sand-200 bg-white text-sand-900 shadow-soft hover:border-sand-300 hover:bg-sand-50",
  ghost: "text-sand-800 hover:bg-sand-100 active:bg-sand-200",
  danger:
    "bg-clay-600 text-white shadow-soft hover:bg-clay-700 active:bg-clay-700",
  "danger-ghost": "text-clay-600 hover:bg-clay-50 active:bg-clay-100",
} as const;

// Touch targets stay ≥44px (WCAG 2.5.5) — "sm" is only for dense
// caregiver tables, never primary actions.
const sizes = {
  sm: "min-h-11 px-4 text-sm rounded-xl gap-1.5",
  md: "min-h-12 px-5 text-base rounded-xl gap-2",
  lg: "min-h-14 px-7 text-lg rounded-2xl gap-2.5",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex select-none items-center justify-center font-semibold transition-all",
          "disabled:pointer-events-none disabled:opacity-60",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  },
);
