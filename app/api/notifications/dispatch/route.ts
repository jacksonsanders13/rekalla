import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dispatchPendingNotifications } from "@/lib/notifications";

/**
 * Processes the notification outbox for the signed-in user.
 *
 * In production this is triggered by the Vercel cron in vercel.json; it can
 * also be called after queueing an alert so delivery feels immediate.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const result = await dispatchPendingNotifications(supabase);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 },
    );
  }
}
