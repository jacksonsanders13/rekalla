import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/**
 * Server-side helper: returns the signed-in user and their profile, or
 * redirects to /login. Used by app pages to branch on account type.
 */
export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Never fail silently: a profile read error means the app can't know the
  // account type and every role check downstream degrades. Surface it loudly
  // in the server log so it's diagnosable (e.g. missing table grants / RLS).
  if (error) {
    console.error(
      `[session] failed to load profile for ${user.id}: ${error.code ?? ""} ${error.message}`,
    );
  }

  return { user, profile: (profile ?? null) as Profile | null };
}

/**
 * v2 is a single-user product for the older adult — there are no roles. This
 * just requires a signed-in user (getSessionProfile redirects to /login if
 * not) and returns them. Legacy caregiver accounts get the elder experience
 * too; the old /caregiver screens are no longer routed to.
 */
export async function requirePatient() {
  return getSessionProfile();
}
