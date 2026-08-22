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
