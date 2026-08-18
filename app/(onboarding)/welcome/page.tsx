import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePatient } from "@/lib/session";
import { WelcomeSurvey } from "@/components/onboarding/welcome-survey";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { user, profile } = await requirePatient();

  // Already finished the survey? Straight to the chat.
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("personalization_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.onboarded_at) redirect("/assistant");

  const firstName = profile?.full_name?.split(" ")[0];
  return <WelcomeSurvey userId={user.id} name={firstName} initialProfile={data} />;
}
