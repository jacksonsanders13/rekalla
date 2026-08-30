/**
 * Retry for the network calls in the scan flow.
 *
 * Someone photographing a bill at their kitchen table is often on a weak
 * connection, and losing the photo to one dropped request is the worst moment
 * in the app. Two extra attempts with a short backoff clears most of it.
 */

/** Roughly, does this look like the network rather than a real refusal? */
export function isTransient(e: unknown): boolean {
  const message = (
    (e as { message?: string })?.message ??
    (typeof e === "string" ? e : "")
  ).toLowerCase();
  if (!message) return true; // no detail at all is usually a dropped request
  return (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("aborted") ||
    message.includes("socket") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504")
  );
}

/**
 * Run `work`, retrying while the failure looks transient. Waits 600ms, then
 * 1.8s, so a flaky moment resolves without the person noticing, and a real
 * error still surfaces quickly.
 */
export async function withRetry<T>(
  work: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await work();
    } catch (e) {
      lastError = e;
      const hasAnotherGo = attempt < attempts - 1;
      if (!hasAnotherGo || !isTransient(e)) break;
      await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(3, attempt)));
    }
  }

  throw lastError;
}
