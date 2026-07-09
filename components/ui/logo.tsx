import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// The mark lives at public/logo.svg — replace that file with your own
// export (same name) to swap the logo everywhere at once.
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
      <Image
        src="/logo.svg"
        alt=""
        width={s.box}
        height={s.box}
        priority
        className="rounded-[24%] bg-base ring-1 ring-white/15"
      />
      {wordmark && (
        <span className={cn("font-semibold tracking-tight text-label", s.text)}>
          Rekalla
        </span>
      )}
    </Link>
  );
}
