// Strict retrieval for the closed-domain assistant.
//
// Every query here runs through a USER-SCOPED Supabase client, so Postgres RLS
// is the real security boundary — the assistant can only ever see rows the
// signed-in elder is allowed to see. The retrieved bundle is the ONLY ground
// truth handed to the model; nothing else is in scope.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface RetrievedContext {
  profile: Record<string, unknown> | null;
  contacts: Array<Record<string, unknown>>;
  calendarThisWeek: Array<Record<string, unknown>>;
  routine: Array<Record<string, unknown>>;
  recentMessages: Array<Record<string, unknown>>;
  recentCareNotes: Array<Record<string, unknown>>;
}

// 0 = Sunday ... 6 = Saturday, matching reminders.days_of_week convention.
function weekdayNumbers(): number[] {
  return [0, 1, 2, 3, 4, 5, 6];
}

export async function retrieveContext(
  db: SupabaseClient,
  elderId: string,
): Promise<RetrievedContext> {
  const today = new Date().toISOString().slice(0, 10);

  // Run independent reads in parallel. Each is RLS-scoped to the caller.
  const [
    profileRes,
    contactsRes,
    remindersRes,
    routineRes,
    messagesRes,
    careNotesRes,
  ] = await Promise.all([
    db
      .from("personalization_profiles")
      .select(
        "identity, people, routine, interests, preferences, practical, section_status",
      )
      .eq("user_id", elderId)
      .maybeSingle(),
    db
      .from("care_relationships")
      .select("caregiver_id, invited_email, relationship, status")
      .eq("patient_id", elderId),
    // Active reminders whose window covers today = "this week" calendar surface.
    db
      .from("reminders")
      .select(
        "title, description, category, time_of_day, recurrence, days_of_week, start_date, end_date",
      )
      .eq("user_id", elderId)
      .eq("is_active", true)
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`),
    db
      .from("routine_items")
      .select("title, period, time_of_day, sort_order")
      .eq("user_id", elderId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    db
      .from("messages")
      .select("sender_id, body, created_at")
      .eq("user_id", elderId)
      .order("created_at", { ascending: false })
      .limit(40),
    db
      .from("care_notes")
      .select("author_id, body, created_at")
      .eq("user_id", elderId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    profile: profileRes.data ?? null,
    contacts: contactsRes.data ?? [],
    calendarThisWeek: remindersRes.data ?? [],
    routine: routineRes.data ?? [],
    recentMessages: (messagesRes.data ?? []).reverse(), // oldest→newest for reading
    recentCareNotes: careNotesRes.data ?? [],
  };
}

// Turn contacts into a priority-ordered list the escalation UI can trust.
// emergency_contacts in the profile carry an explicit `priority`; fall back to
// care_relationships when the profile hasn't been filled in.
export function orderedEmergencyContacts(
  ctx: RetrievedContext,
): Array<{ name?: string; phone?: string; relationship?: string; priority?: number }> {
  const practical = (ctx.profile?.practical ?? {}) as Record<string, unknown>;
  const fromProfile = Array.isArray(practical.emergency_contacts)
    ? (practical.emergency_contacts as Array<Record<string, unknown>>)
    : [];
  if (fromProfile.length > 0) {
    return [...fromProfile]
      .map((c) => ({
        name: c.name as string | undefined,
        phone: c.phone as string | undefined,
        relationship: c.relationship as string | undefined,
        priority: typeof c.priority === "number" ? c.priority : 999,
      }))
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  }
  return ctx.contacts.map((c) => ({
    relationship: c.relationship as string | undefined,
    priority: 999,
  }));
}

export { weekdayNumbers };
