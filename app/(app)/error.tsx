"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RekallaAvatar } from "@/components/ui/rekalla-avatar";

/**
 * Catches a render error anywhere in the signed-in app. The header and tab bar
 * stay put, so the person is never stranded on a blank screen with no way out.
 *
 * Nothing technical is shown. The message goes to the console for us instead.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App render error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <RekallaAvatar size={104} />

      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-label">Something went wrong</h1>
        <p className="mx-auto max-w-sm text-xl leading-relaxed text-label-2">
          That is my fault, not yours. Nothing you have saved is affected.
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
          href="/home"
          className="flex min-h-14 items-center justify-center rounded-full bg-elev-1 px-8 text-xl font-semibold text-label transition-colors hover:bg-elev-2"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
