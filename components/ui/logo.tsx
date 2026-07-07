import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-8 rounded-lg", text: "text-lg" },
  md: { box: "size-10 rounded-xl", text: "text-xl" },
} as const;

export function Logo({
  size = "md",
  href = "/",
  className,
}: {
  size?: keyof typeof sizes;
  href?: string;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Rekalla home"
    >
      <span
        className={cn(
          "flex items-center justify-center bg-sage-600 font-display font-semibold text-white",
          s.box,
          s.text,
        )}
        aria-hidden="true"
      >
        R
      </span>
      <span className={cn("font-display font-semibold text-sand-950", s.text)}>
        Rekalla
      </span>
    </Link>
  );
}
