import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CaregiverView } from "@/components/caregiver/caregiver-view";

export const metadata: Metadata = { title: "Caregivers" };

export default async function CaregiverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <CaregiverView userId={user!.id} email={user!.email ?? ""} />;
}
