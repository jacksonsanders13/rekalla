import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { CaregiverHome } from "@/components/caregiver/caregiver-home";

export const metadata: Metadata = { title: "People" };

export default async function CaregiverPage() {
  const { user, profile } = await getSessionProfile();

  // This is the caregiver's dashboard only. A Loved One who lands here goes
  // to their own connect screen.
  if (profile?.account_type !== "caregiver") {
    redirect("/connect");
  }

  return <CaregiverHome caregiverId={user.id} />;
}
