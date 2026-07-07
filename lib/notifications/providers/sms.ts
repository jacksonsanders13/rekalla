import type { NotificationPayload, NotificationProvider, SendResult } from "../types";

/**
 * SMS notifications.
 *
 * Mock implementation: logs and reports success. To go live, exchange this
 * for a Twilio API call using `metadata.phone` as the recipient number.
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
    console.info(
      `[notifications:sms] (mock) → user ${payload.userId}: ${payload.title}`,
    );
    return { ok: true, providerId: `mock-sms-${Date.now()}` };
  },
};
