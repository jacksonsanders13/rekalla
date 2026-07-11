import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-white text-black hover:bg-white/90 active:bg-white/80",
  secondary: "bg-elev-2 text-label hover:bg-elev-3 active:bg-elev-3",
  ghost: "text-label-2 hover:bg-white/10 active:bg-white/15",
  danger: "bg-tint-red text-white hover:brightness-110 active:brightness-90",
  "danger-ghost": "text-tint-red hover:bg-tint-red/10 active:bg-tint-red/15",
} as const;

// Touch targets stay ≥44px (WCAG 2.5.5) — "sm" is only for dense
// rows, never primary actions.
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
          "disabled:pointer-events-none disabled:opacity-50",
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
