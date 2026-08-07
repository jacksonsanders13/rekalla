/** Shared date/text helpers (portable copy of the web app's lib/utils). */

export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0];
}

export function formatTimeOfDay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Local date as "YYYY-MM-DD" — the canonical day key everywhere. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Whether a Supabase auth error is an internal failure rather than something
 * the person can act on.
 *
 * Most auth errors are written for humans ("Invalid login credentials") and
 * should be shown as-is. A 5xx is not: it carries raw Go/Postgres text, and one
 * of them filled the sign-up screen with `sql: Scan error on column index 3,
 * name "confirmation_token"…`. Callers show `auth.err.unexpected` instead.
 */
export function isInternalAuthError(
  error: { status?: number; code?: string } | null,
): boolean {
  if (!error) return false;
  return (
    (error.status !== undefined && error.status >= 500) ||
    error.code === "unexpected_failure"
  );
}

/** Minutes a snoozed reminder waits before coming back. */
export const SNOOZE_MINUTES = 30;
