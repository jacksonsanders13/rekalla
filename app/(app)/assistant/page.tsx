import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePatient } from "@/lib/session";
import { AssistantView } from "@/components/assistant/assistant-view";

export const metadata: Metadata = { title: "Ask Rekalla" };

export default async function AssistantPage() {
  const { user } = await requirePatient();

  // First time here? Send them through the welcome survey before the chat.
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("personalization_profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data?.onboarded_at) redirect("/welcome");

  return <AssistantView userId={user.id} />;
}
