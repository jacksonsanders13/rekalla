"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Catches a render error outside the signed-in app: the landing page and the
 * auth screens. Kept plain, since someone hitting this may not know what
 * Rekalla is yet.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-label">Something went wrong</h1>
        <p className="mx-auto max-w-sm text-xl leading-relaxed text-label-2">
          This page did not load properly. It is not something you did.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex min-h-14 items-center justify-center rounded-full bg-accent px-8 text-xl font-bold text-white transition-colors hover:bg-accent-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex min-h-14 items-center justify-center rounded-full bg-elev-1 px-8 text-xl font-semibold text-label transition-colors hover:bg-elev-2"
        >
          Start over
        </Link>
      </div>
    </div>
  );
}
