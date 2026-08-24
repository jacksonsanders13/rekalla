import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/session";
import { SettingsView } from "@/components/profile/settings-view";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await getSessionProfile();
  return (
    <SettingsView
      userId={user.id}
      email={user.email ?? ""}
      initialName={profile?.full_name ?? ""}
      initialPhone={(profile as { phone?: string } | null)?.phone ?? ""}
    />
  );
}
