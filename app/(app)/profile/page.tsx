import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const { user } = await requirePatient();
  return <ProfileView userId={user.id} />;
}
