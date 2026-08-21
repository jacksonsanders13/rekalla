import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requirePatient } from "@/lib/session";
import { AssistantView } from "@/components/assistant/assistant-view";

export const metadata: Metadata = { title: "Ask Rekalla" };

export default async function AssistantPage() {
  const { user } = await requirePatient();

  // First-run onboarding happens right inside the chat (Rekalla asks a few
  // questions). We just tell the chat whether it's already been done.
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("personalization_profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return <AssistantView userId={user.id} onboarded={!!data?.onboarded_at} />;
}
