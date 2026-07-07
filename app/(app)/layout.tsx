import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppProviders } from "./providers";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav, MobileHeader } from "@/components/layout/mobile-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email || "You";

  return (
    <AppProviders>
      <div className="min-h-dvh lg:flex">
        <Sidebar displayName={displayName} email={user.email ?? ""} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader displayName={displayName} />
          <main
            id="main"
            className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10"
          >
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </AppProviders>
  );
}
