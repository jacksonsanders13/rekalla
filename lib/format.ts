/** Friendly date/time formatting for the calendar + reminder lists. */

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

export function formatTime(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isFinite(hh)) return time;
  const d = new Date();
  d.setHours(hh, Number.isFinite(mm) ? mm : 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function isToday(dateISO: string): boolean {
  const [y, m, d] = dateISO.split("-").map(Number);
  const now = new Date();
  return y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
}
