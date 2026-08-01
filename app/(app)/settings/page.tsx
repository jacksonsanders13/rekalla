import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/session";
import { SettingsView } from "@/components/settings/settings-view";
import type { Profile } from "@/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, profile } = await getSessionProfile();

  // Never bounce to /login here — the middleware already guarantees a signed-in
  // user, and bouncing would get re-redirected to the dashboard. If the profile
  // row is somehow missing, fall back to sensible defaults so Settings opens.
  const safeProfile: Profile = profile ?? {
    id: user.id,
    full_name: "",
    avatar_url: null,
    phone: null,
    timezone: "America/New_York",
    account_type: "patient",
    connect_code: null,
    self_managed: false,
    created_at: "",
    updated_at: "",
  };

  return <SettingsView profile={safeProfile} email={user.email ?? ""} />;
}
