"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, CalendarDays, ChevronRight, Receipt, Stethoscope } from "lucide-react";
import { AskBox } from "@/components/home/ask-box";
import { EventEditor } from "@/components/calendar/event-editor";
import { useUpcomingReminders, type Reminder } from "@/hooks/use-scans";
import { formatDay, formatTime, isToday } from "@/lib/format";

export function HomeView({ userId }: { userId: string }) {
  const { data: upcoming, isLoading } = useUpcomingReminders(userId);

  return (
    <div className="space-y-6">
      <Link
        href="/scan"
        className="flex flex-col items-center gap-2 rounded-2xl bg-accent px-6 py-8 text-white transition-colors hover:bg-accent-2"
      >
        <Camera className="size-11" aria-hidden="true" />
        <span className="font-display text-3xl font-semibold tracking-tight">Scan something</span>
        <span className="text-base text-white/85">A calendar, an appointment card, or a bill</span>
      </Link>

      <AskBox userId={userId} />

      <h2 className="border-b border-white/15 pb-2 pt-2 font-display text-2xl font-semibold tracking-tight text-label">What&apos;s coming up</h2>
      {isLoading ? (
        <p className="text-xl text-label-3">Loading…</p>
      ) : !upcoming || upcoming.length === 0 ? (
        <div className="rounded-2xl bg-elev-1 p-5">
          <p className="text-xl leading-relaxed text-label-2">
            Nothing here yet. Scan a paper calendar, an appointment card, or a
            bill, and it will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-elev-1">
          {upcoming.map((r) => (
            <li key={r.id}>
              <ReminderRow r={r} userId={userId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One event in a list. Clicking it opens the editor. */
export function ReminderRow({ r, userId }: { r: Reminder; userId: string }) {
  const [editing, setEditing] = useState(false);
  const time = r.time_of_day ? formatTime(r.time_of_day) : "All day";
  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`${r.title}, ${formatDay(r.start_date)}, ${time}. Click to edit`}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-elev-2"
      >
        <ItemIcon category={r.category} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-label">{r.title}</p>
          <p className="text-sm text-label-3">
            {formatDay(r.start_date)} · {time}
            {r.description ? ` · ${r.description}` : ""}
          </p>
        </div>
        {isToday(r.start_date) && (
          <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        )}
        <ChevronRight className="size-5 shrink-0 text-label-4" aria-hidden="true" />
      </button>
      <EventEditor
        reminder={r}
        userId={userId}
        open={editing}
        onClose={() => setEditing(false)}
      />
    </>
  );
}

function ItemIcon({ category }: { category: string }) {
  const cls = "size-6 shrink-0 text-label-3";
  if (category === "bill") return <Receipt className={cls} aria-hidden="true" />;
  if (category === "appointments") return <Stethoscope className={cls} aria-hidden="true" />;
  return <CalendarDays className={cls} aria-hidden="true" />;
}
