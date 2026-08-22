import { Settings } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/** Slim top bar. The logo returns to the assistant (home); a settings shortcut. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2.5">
        <Logo size="md" wordmark={false} href="/home" />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-11 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-white/10 hover:text-label"
        >
          <Settings className="size-6" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
