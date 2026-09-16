import type { NotificationPayload, NotificationProvider, SendResult } from "../types";

/**
 * Email notifications.
 *
 * Not implemented. To go live, exchange the body of `send` for a Resend (or
 * similar) API call using `metadata.email` as the recipient address.
 *
 * It reports failure rather than success on purpose. This used to log and
 * return ok, which had the dispatcher write `status: "sent"` on a message
 * nobody ever received.
 */
export const emailProvider: NotificationProvider = {
  channel: "email",

  isConfigured() {
    return Boolean(process.env.RESEND_API_KEY);
  },

  async send(payload: NotificationPayload): Promise<SendResult> {
    console.warn(
      `[notifications:email] not implemented, dropping → user ${payload.userId}: ${payload.title}`,
    );
    return { ok: false, error: "email provider is not implemented" };
  },
};
