import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RoutineView } from "@/components/routine/routine-view";

export const metadata: Metadata = { title: "Daily routine" };

export default async function RoutinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <RoutineView userId={user!.id} />;
}
