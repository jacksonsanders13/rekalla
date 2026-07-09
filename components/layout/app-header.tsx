import Link from "next/link";
import { HeartHandshake, Settings } from "lucide-react";
import { Logo } from "@/components/ui/logo";

/** Slim top bar: logo on the left, sharing + settings on the right. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2.5">
        <Logo size="md" wordmark={false} />
        <div className="flex items-center gap-1">
          <Link
            href="/caregiver"
            aria-label="Sharing and caregivers"
            className="flex size-11 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-white/10 hover:text-label"
          >
            <HeartHandshake className="size-6" aria-hidden="true" />
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-11 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-white/10 hover:text-label"
          >
            <Settings className="size-6" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
