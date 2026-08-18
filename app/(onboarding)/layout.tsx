import { AppProviders } from "../(app)/providers";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Full-screen shell for the welcome survey: providers, but no header or tabs.
export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppProviders>
      <main className="min-h-dvh bg-base">{children}</main>
    </AppProviders>
  );
}
