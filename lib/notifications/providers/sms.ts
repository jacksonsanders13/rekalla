import type { NotificationPayload, NotificationProvider, SendResult } from "../types";

/**
 * SMS notifications.
 *
 * Not implemented. To go live, exchange the body of `send` for a Twilio API
 * call using `metadata.phone` as the recipient number.
 *
 * It reports failure rather than success on purpose. This used to log and
 * return ok, which had the dispatcher write `status: "sent"` on a message
 * nobody ever received.
 */
export const smsProvider: NotificationProvider = {
  channel: "sms",

  isConfigured() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER,
    );
  },

  async send(payload: NotificationPayload): Promise<SendResult> {
    console.warn(
      `[notifications:sms] not implemented, dropping → user ${payload.userId}: ${payload.title}`,
    );
    return { ok: false, error: "sms provider is not implemented" };
  },
};
