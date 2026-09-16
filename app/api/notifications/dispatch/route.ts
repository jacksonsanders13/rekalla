import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dispatchPendingNotifications } from "@/lib/notifications";

/**
 * Processes the notification outbox for the signed-in user.
 *
 * Nothing calls this on a schedule. vercel.json has no `crons` entry, so the
 * outbox is only ever drained by an explicit POST here. Scheduled delivery
 * needs that cron adding, pointed at this route with a service-role client.
 *
 * Nothing writes to the outbox either, so it is empty in practice. The
 * patient's own reminders do not come through here; they are local
 * notifications on the device, in mobile/lib/notifications.ts.
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
