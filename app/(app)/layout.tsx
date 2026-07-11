import { getSessionProfile } from "@/lib/session";
import { AppProviders } from "./providers";
import { AppHeader } from "@/components/layout/app-header";
import { TabBar } from "@/components/layout/tab-bar";
import type { AccountType } from "@/types/database";

// Always render the signed-in app fresh and never cache the profile read —
// account type / session must reflect the current user on every request.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await getSessionProfile();
  const accountType: AccountType = profile?.account_type ?? "patient";

  return (
    <AppProviders>
      <div className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-elev-2 focus:px-4 focus:py-2 focus:text-label"
        >
          Skip to main content
        </a>
        <AppHeader accountType={accountType} />
        <main id="main" className="mx-auto w-full max-w-xl px-4 pb-32 pt-6">
          {children}
        </main>
        <TabBar accountType={accountType} />
      </div>
    </AppProviders>
  );
}
