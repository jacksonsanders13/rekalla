import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RemindersView } from "@/components/reminders/reminders-view";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The layout already redirects unauthenticated users.
  const userId = user!.id;

  return <RemindersView userId={userId} actorId={userId} />;
}
