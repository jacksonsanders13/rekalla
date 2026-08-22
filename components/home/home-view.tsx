"use client";

import Link from "next/link";
import { Camera, MessageCircle, CalendarDays, Receipt, Stethoscope } from "lucide-react";
import { useUpcomingReminders, type Reminder } from "@/hooks/use-scans";
import { formatDay, formatTime, isToday } from "@/lib/format";

export function HomeView({ userId }: { userId: string }) {
  const { data: upcoming, isLoading } = useUpcomingReminders(userId);

  return (
    <div className="space-y-6">
      <h1 className="text-center text-3xl font-bold text-label">Rekalla</h1>

      <Link
        href="/scan"
        className="flex flex-col items-center gap-2 rounded-[28px] bg-gradient-to-br from-accent to-accent-2 px-6 py-10 text-white shadow-[0_8px_40px_rgba(139,124,255,0.45)] transition-all hover:brightness-110"
      >
        <Camera className="size-16" aria-hidden="true" />
        <span className="text-3xl font-extrabold">Scan something</span>
        <span className="text-base text-white/90">A calendar, an appointment card, or a bill</span>
      </Link>

      <Link
        href="/assistant"
        className="flex min-h-[56px] items-center justify-center gap-2.5 rounded-2xl bg-elev-1 text-xl font-bold text-label hover:bg-elev-2"
      >
        <MessageCircle className="size-6 text-label-2" aria-hidden="true" /> Ask Rekalla
      </Link>

      <h2 className="pt-2 text-2xl font-bold text-label">What&apos;s coming up</h2>
      {isLoading ? (
        <p className="text-xl text-label-3">Loading…</p>
      ) : !upcoming || upcoming.length === 0 ? (
        <div className="rounded-2xl bg-elev-1 p-5">
          <p className="text-xl leading-relaxed text-label-2">
            Nothing yet. Tap “Scan something” to add your paper calendar,
            appointments, or bills — Rekalla will remind you.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((r) => (
            <li key={r.id}>
              <ReminderRow r={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReminderRow({ r }: { r: Reminder }) {
  const time = r.time_of_day ? formatTime(r.time_of_day) : "All day";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-elev-1 p-4">
      <span className={`h-11 w-2 shrink-0 rounded-full ${isToday(r.start_date) ? "bg-accent" : "bg-elev-3"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-label">{r.title}</p>
        <p className="text-sm text-label-3">
          {formatDay(r.start_date)} · {time}
          {r.description ? ` · ${r.description}` : ""}
        </p>
      </div>
      <ItemIcon category={r.category} />
    </div>
  );
}

function ItemIcon({ category }: { category: string }) {
  const cls = "size-6 shrink-0 text-label-3";
  if (category === "bill") return <Receipt className={cls} aria-hidden="true" />;
  if (category === "appointments") return <Stethoscope className={cls} aria-hidden="true" />;
  return <CalendarDays className={cls} aria-hidden="true" />;
}
