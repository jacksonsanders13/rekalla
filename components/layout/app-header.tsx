import Link from "next/link";
import { HeartHandshake, Settings } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { AccountType } from "@/types/database";

/** Slim top bar. Patients get a sharing shortcut; caregivers a settings one. */
export function AppHeader({ accountType }: { accountType: AccountType }) {
  const home = accountType === "caregiver" ? "/caregiver" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2.5">
        <Logo size="md" wordmark={false} href={home} />
        <div className="flex items-center gap-1">
          {accountType === "patient" && (
            <Link
              href="/connect"
              aria-label="My caregivers and connect code"
              className="flex size-11 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-white/10 hover:text-label"
            >
              <HeartHandshake className="size-6" aria-hidden="true" />
            </Link>
          )}
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
