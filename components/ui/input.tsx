import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClasses =
  "block w-full min-h-13 rounded-xl border border-transparent bg-elev-1 px-4 py-3 text-base text-label transition-colors placeholder:text-label-4 hover:bg-elev-2 focus:border-white focus:bg-elev-1 focus:outline-none focus:ring-[3px] focus:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-tint-red aria-[invalid=true]:focus:ring-tint-red/25 [color-scheme:dark]";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClasses, className)} {...props} />;
});
