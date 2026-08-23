// Retrieval for the v3 basic chat. Everything runs through a USER-SCOPED
// Supabase client, so RLS is the security boundary — the assistant only ever
// sees the signed-in person's own rows. This bundle is the ONLY ground truth.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface RetrievedContext {
  name: string | null;
  reminders: Array<Record<string, unknown>>;
  vault: Array<Record<string, unknown>>;
}

export async function retrieveContext(
  db: SupabaseClient,
  userId: string,
): Promise<RetrievedContext> {
  const [profileRes, remindersRes, vaultRes] = await Promise.all([
    db.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    db
      .from("reminders")
      .select("title, description, category, time_of_day, recurrence, start_date, end_date")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("start_date", { ascending: true })
      .limit(200),
    db
      .from("vault_items")
      .select("category, title, subtitle, notes, date_value, phone, email, address")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  return {
    name: (profileRes.data?.full_name as string | undefined) ?? null,
    reminders: remindersRes.data ?? [],
    vault: vaultRes.data ?? [],
  };
}
