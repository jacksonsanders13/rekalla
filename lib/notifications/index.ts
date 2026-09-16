import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NotificationChannel } from "@/types/database";
import type { NotificationProvider } from "./types";
import { pushProvider } from "./providers/push";
import { emailProvider } from "./providers/email";
import { smsProvider } from "./providers/sms";

const providers: Record<NotificationChannel, NotificationProvider> = {
  push: pushProvider,
  email: emailProvider,
  sms: smsProvider,
};

/**
 * Deliver every due notification in the outbox (status = pending and
 * scheduled_for in the past), marking each row sent or failed.
 *
 * Called from the /api/notifications/dispatch route. Today the app invokes
 * it right after queueing an alert; for scheduled delivery, call it from a
 * cron job using a service-role client. Runs with the caller's Supabase
 * client, so RLS still applies.
 *
 * A channel whose provider has no configuration is counted as `skipped` and
 * left `pending` rather than marked sent or failed, so nothing is recorded as
 * delivered that no provider ever attempted, and the row is still there to
 * send once the channel is configured.
 */
export async function dispatchPendingNotifications(
  supabase: SupabaseClient<Database>,
): Promise<{ sent: number; failed: number; skipped: number }> {
  const { data: pending, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(50);

  if (error) throw error;

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of pending ?? []) {
    const provider = providers[notification.channel];

    // Nothing can be delivered without credentials, and marking the row either
    // way would be a lie: `sent` claims a delivery that never happened, and
    // `failed` blames a send that was never attempted. Leave it pending.
    if (!provider.isConfigured()) {
      skipped++;
      continue;
    }

    try {
      const result = await provider.send({
        userId: notification.user_id,
        title: notification.title,
        body: notification.body,
        metadata: (notification.metadata ?? {}) as Record<string, unknown>,
      });

      await supabase
        .from("notifications")
        .update(
          result.ok
            ? { status: "sent", sent_at: new Date().toISOString() }
            : { status: "failed" },
        )
        .eq("id", notification.id);

      if (result.ok) {
        sent++;
      } else {
        failed++;
      }
    } catch {
      await supabase
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notification.id);
      failed++;
    }
  }

  return { sent, failed, skipped };
}
