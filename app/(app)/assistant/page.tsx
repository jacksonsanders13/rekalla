import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePatient } from "@/lib/session";
import { AssistantView } from "@/components/assistant/assistant-view";

export const metadata: Metadata = { title: "Ask Rekalla" };

export default async function AssistantPage() {
  const { user } = await requirePatient();

  // First time here? Send them through the welcome survey before the chat.
  // Only redirect when we actually know they haven't onboarded — never bounce
  // them on a transient read error.
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("personalization_profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!error && !data?.onboarded_at) redirect("/welcome");

  return <AssistantView userId={user.id} />;
}
