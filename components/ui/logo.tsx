import Link from "next/link";
import { cn } from "@/lib/utils";
import { RekallaAvatar } from "@/components/ui/rekalla-avatar";

// The mark is Rekalla himself, drawn inline from the shared geometry rather
// than loaded as a file, so the header and the app icons cannot drift apart.
// public/logo.svg is the same drawing, for the places that need a URL.
const sizes = {
  sm: { box: 32, text: "text-lg" },
  md: { box: 44, text: "text-xl" },
  lg: { box: 72, text: "text-2xl" },
} as const;

export function Logo({
  size = "md",
  href = "/dashboard",
  wordmark = true,
  className,
}: {
  size?: keyof typeof sizes;
  href?: string;
  wordmark?: boolean;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-3", className)}
      aria-label="Rekalla home"
    >
      <RekallaAvatar size={s.box} className="rounded-[24%] bg-base" />
      {wordmark && (
        <span className={cn("font-semibold tracking-tight text-label", s.text)}>
          Rekalla
        </span>
      )}
    </Link>
  );
}
