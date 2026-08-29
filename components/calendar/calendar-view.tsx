"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReminders, type Reminder } from "@/hooks/use-scans";
import { ReminderRow } from "@/components/home/home-view";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function CalendarView({ userId }: { userId: string }) {
  const { data: reminders } = useReminders(userId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(iso(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayISO = iso(now.getFullYear(), now.getMonth(), now.getDate());

  const byDay = useMemo(() => {
    const map: Record<string, Reminder[]> = {};
    for (const r of reminders ?? []) (map[r.start_date] ??= []).push(r);
    return map;
  }, [reminders]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const dayItems = byDay[selected] ?? [];

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <h1 className="text-center font-display text-3xl font-bold tracking-tight text-label">Calendar</h1>

      <div className="flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="flex size-11 items-center justify-center rounded-full text-label hover:bg-white/10">
          <ChevronLeft className="size-7" aria-hidden="true" />
        </button>
        <span className="text-2xl font-semibold text-label">{monthLabel}</span>
        <button onClick={() => shift(1)} aria-label="Next month" className="flex size-11 items-center justify-center rounded-full text-label hover:bg-white/10">
          <ChevronRight className="size-7" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="py-1 text-center text-sm font-semibold text-label-3">{w}</span>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === 0) return <span key={di} className="aspect-square" />;
              const dISO = iso(year, month, day);
              const has = !!byDay[dISO]?.length;
              const isSel = dISO === selected;
              return (
                <button
                  key={di}
                  onClick={() => setSelected(dISO)}
                  aria-label={`${monthLabel} ${day}${has ? ", has items" : ""}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-xl text-lg text-label",
                    isSel && "bg-white font-semibold text-black",
                    !isSel && dISO === todayISO && "ring-2 ring-accent",
                  )}
                >
                  {day}
                  {has && <span className={cn("mt-0.5 size-1.5 rounded-full", isSel ? "bg-black" : "bg-accent")} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <h2 className="border-b border-white/15 pb-2 pt-2 font-display text-2xl font-semibold tracking-tight text-label">
        {selected === todayISO
          ? "Today"
          : new Date(selected).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </h2>
      {dayItems.length === 0 ? (
        <p className="text-xl text-label-3">Nothing on this day.</p>
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-elev-1">
          {dayItems.map((r) => (
            <li key={r.id}>
              <ReminderRow r={r} userId={userId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildWeeks(year: number, month: number): number[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: number[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(0);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(0);
  const weeks: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
