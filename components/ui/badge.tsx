import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  sage: "bg-sage-100 text-sage-800",
  sand: "bg-sand-100 text-sand-800",
  clay: "bg-clay-100 text-clay-700",
  sky: "bg-sky-100 text-sky-700",
  honey: "bg-honey-100 text-honey-700",
  plum: "bg-plum-100 text-plum-700",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "sand",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
