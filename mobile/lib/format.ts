/** Friendly date/time formatting for the calendar + reminder lists. */

/** "2026-08-25" -> "Mon, Aug 25" (adds the year if it isn't this year). */
export function formatDay(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return dateISO;
  const date = new Date(y, m - 1, d);
  const opts: Intl.DateTimeFormatOptions =
    y === new Date().getFullYear()
      ? { weekday: "short", month: "short", day: "numeric" }
      : { weekday: "short", month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString(undefined, opts);
}

/** "14:00" or "14:00:00" -> "2:00 PM". */
export function formatTime(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isFinite(hh)) return time;
  const d = new Date();
  d.setHours(hh, Number.isFinite(mm) ? mm : 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Group by day and sort, for an agenda list. */
export function isToday(dateISO: string): boolean {
  const [y, m, d] = dateISO.split("-").map(Number);
  const now = new Date();
  return y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
}
/** YYYY-MM-DD for a Date, in the device's own timezone (never UTC). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The reverse: a local Date from YYYY-MM-DD, or null if it isn't one. */
export function parseISODate(dateISO: string): Date | null {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** "Tuesday, September 1" — the agenda heading and the editor's date row. */
export function formatFullDay(dateISO: string): string {
  const date = parseISODate(dateISO);
  if (!date) return dateISO;
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
