import type { NotificationPayload, NotificationProvider, SendResult } from "../types";

/**
 * Push notifications, targeting the Expo mobile app.
 *
 * Not implemented. To go live, exchange the body of `send` for a call to the
 * Expo push API (https://exp.host/--/api/v2/push/send) using device tokens
 * stored in `metadata.pushToken`.
 *
 * Note this is the caregiver-facing outbox, not the patient's own reminders.
 * Those are local on-device notifications scheduled in
 * mobile/lib/notifications.ts and do not go through here.
 *
 * It reports failure rather than success on purpose. This used to log and
 * return ok, which had the dispatcher write `status: "sent"` on a message
 * nobody ever received.
 */
export const pushProvider: NotificationProvider = {
  channel: "push",

  isConfigured() {
    return Boolean(process.env.EXPO_ACCESS_TOKEN);
  },

  async send(payload: NotificationPayload): Promise<SendResult> {
    console.warn(
      `[notifications:push] not implemented, dropping → user ${payload.userId}: ${payload.title}`,
    );
    return { ok: false, error: "push provider is not implemented" };
  },
};
