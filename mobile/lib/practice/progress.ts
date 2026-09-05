/**
 * Counting practice, forgivingly.
 *
 * Two numbers are shown on the home screen: how many days someone has
 * practiced altogether, and how their current run is going. The run is the
 * one that needs care. A missed day here usually means a hospital
 * appointment, a visit from family, or a bad night, and none of those are
 * reasons to take somebody's work away from them.
 *
 * So the run erodes instead of resetting. Practicing on consecutive days adds
 * one. Missing a single day costs nothing at all. After that each further
 * missed day takes one off, and it stops at zero. Nothing here can produce a
 * number that goes to zero overnight.
 */

const DAY_MS = 86_400_000;

/** Whole days between two "YYYY-MM-DD" keys. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  return Math.round((end - start) / DAY_MS);
}

/** Days practiced altogether. This one only ever goes up. */
export function daysPracticed(practiceDays: string[]): number {
  return new Set(practiceDays).size;
}

/**
 * The current run, as of `today`. A gap of one day is free; longer gaps take
 * one off the run per extra day rather than wiping it.
 */
export function currentRun(practiceDays: string[], today: string): number {
  const days = [...new Set(practiceDays)].sort();
  if (days.length === 0) return 0;

  let run = 0;
  let previous: string | null = null;

  for (const day of days) {
    if (previous === null) {
      run = 1;
    } else {
      const gap = daysBetween(previous, day);
      run = gap === 1 ? run + 1 : Math.max(1, run - Math.max(0, gap - 2));
    }
    previous = day;
  }

  // A gap of one day is free, so "yesterday" and "the day before" both leave
  // the run where it was. Every day after that takes one off.
  const sinceLast = daysBetween(previous as string, today);
  if (sinceLast <= 2) return run;
  return Math.max(0, run - (sinceLast - 2));
}

/** Adds today to the record, keeping it a set and in order. */
export function recordPracticeDay(practiceDays: string[], today: string): string[] {
  if (practiceDays.includes(today)) return practiceDays;
  return [...practiceDays, today].sort();
}
