import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { PatientConnect } from "@/components/caregiver/patient-connect";

export const metadata: Metadata = { title: "My caregivers" };

export default async function ConnectPage() {
  const { user, profile } = await getSessionProfile();

  // Caregivers have their own dashboard.
  if (profile?.account_type === "caregiver") {
    redirect("/caregiver");
  }

  return (
    <PatientConnect
      patientId={user.id}
      connectCode={profile?.connect_code ?? "……"}
    />
  );
}
