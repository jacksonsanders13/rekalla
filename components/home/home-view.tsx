"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, CalendarDays, ChevronRight, Receipt, Stethoscope } from "lucide-react";
import { AskBox } from "@/components/home/ask-box";
import { EventEditor } from "@/components/calendar/event-editor";
import { useUpcomingReminders, type Reminder } from "@/hooks/use-scans";
import { formatDay, formatTime, isToday } from "@/lib/format";

export function HomeView({ userId }: { userId: string }) {
  const { data: upcoming, isLoading } = useUpcomingReminders(userId);

  return (
    <div className="space-y-6">
      <h1 className="flex justify-center">
        <Image src="/logo.svg" alt="Rekalla" width={76} height={76} priority />
      </h1>

      <Link
        href="/scan"
        className="flex flex-col items-center gap-2 rounded-[28px] bg-gradient-to-br from-accent to-accent-2 px-6 py-10 text-white shadow-[0_8px_40px_rgba(139,124,255,0.45)] transition-all hover:brightness-110"
      >
        <Camera className="size-16" aria-hidden="true" />
        <span className="text-3xl font-extrabold">Scan something</span>
        <span className="text-base text-white/90">A calendar, an appointment card, or a bill</span>
      </Link>

      <AskBox />

      <h2 className="pt-2 text-2xl font-bold text-label">What&apos;s coming up</h2>
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
        <ul className="space-y-3">
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
        className="flex w-full items-center gap-3 rounded-2xl bg-elev-1 p-4 text-left transition-colors hover:bg-elev-2"
      >
        <span className={`h-11 w-2 shrink-0 rounded-full ${isToday(r.start_date) ? "bg-accent" : "bg-elev-3"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-label">{r.title}</p>
          <p className="text-sm text-label-3">
            {formatDay(r.start_date)} · {time}
            {r.description ? ` · ${r.description}` : ""}
          </p>
        </div>
        <ItemIcon category={r.category} />
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
