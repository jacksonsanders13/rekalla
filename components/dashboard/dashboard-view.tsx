"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarCheck,
  Check,
  HeartPulse,
  Plus,
  Sunrise,
} from "lucide-react";
import {
  occurrencesFor,
  openOccurrences,
  completionSummary,
} from "@/lib/reminders";
import { MOOD_SCALE } from "@/lib/constants";
import { cn, greetingFor, firstName, toDateKey, formatTimeOfDay } from "@/lib/utils";
import {
  useReminders,
  useReminderEvents,
  useRecordReminderEvent,
} from "@/hooks/use-reminders";
import { useRoutineItems, useRoutineCompletions } from "@/hooks/use-routine";
import { useWellnessEntries } from "@/hooks/use-wellness";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { OccurrenceCard } from "@/components/reminders/occurrence-card";
import { ActivityRings } from "./activity-rings";

// Ring colors follow the Fitness convention: vivid, distinct, on-black.
const RING_COLORS = {
  reminders: "#ff375f",
  routine: "#ffffff",
  checkin: "#64d2ff",
} as const;

const QUICK_ACTIONS = [
  {
    href: "/reminders",
    label: "Add a reminder",
    icon: Plus,
    tone: "bg-white/10 text-white",
  },
  {
    href: "/wellness",
    label: "Daily check-in",
    icon: HeartPulse,
    tone: "bg-tint-teal/15 text-tint-teal",
  },
  {
    href: "/vault",
    label: "Look someone up",
    icon: BookOpen,
    tone: "bg-tint-purple/15 text-tint-purple",
  },
  {
    href: "/routine",
    label: "My routine",
    icon: Sunrise,
    tone: "bg-tint-orange/15 text-tint-orange",
  },
];

function SectionLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-base font-semibold text-white transition-colors hover:bg-white/10"
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function DashboardView({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const todayKey = toDateKey();
  const now = new Date();
  const toast = useToast();

  const reminders = useReminders(userId);
  const events = useReminderEvents(userId, todayKey);
  const recordEvent = useRecordReminderEvent(userId, todayKey);
  const routineItems = useRoutineItems(userId);
  const routineDone = useRoutineCompletions(userId, todayKey);
  const wellness = useWellnessEntries(userId, 7);

  const occurrences = useMemo(
    () => occurrencesFor(reminders.data ?? [], events.data ?? [], todayKey),
    [reminders.data, events.data, todayKey],
  );
  const open = openOccurrences(occurrences);
  const summary = completionSummary(occurrences);

  const upcoming = useMemo(() => {
    const list: { title: string; when: string }[] = [];
    for (let offset = 1; offset <= 7 && list.length < 3; offset++) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const key = toDateKey(date);
      for (const occurrence of occurrencesFor(reminders.data ?? [], [], key)) {
        if (list.length >= 3) break;
        list.push({
          title: occurrence.reminder.title,
          when: `${
            offset === 1
              ? "Tomorrow"
              : date.toLocaleDateString("en-US", { weekday: "long" })
          } at ${formatTimeOfDay(occurrence.reminder.time_of_day)}`,
        });
      }
    }
    return list;
  }, [reminders.data]);

  const routineTotal = routineItems.data?.length ?? 0;
  const routineDoneIds = new Set(
    (routineDone.data ?? []).map((c) => c.routine_item_id),
  );
  const routineDoneCount = (routineItems.data ?? []).filter((i) =>
    routineDoneIds.has(i.id),
  ).length;

  const todayEntry = (wellness.data ?? []).find(
    (e) => e.entry_date === todayKey,
  );
  const todayMood = todayEntry?.mood
    ? MOOD_SCALE.find((m) => m.value === todayEntry.mood)
    : undefined;

  const loading = reminders.isLoading || events.isLoading;

  const ringData = [
    {
      label: "Reminders",
      color: RING_COLORS.reminders,
      progress: summary.total > 0 ? summary.done / summary.total : 0,
      value: summary.total > 0 ? `${summary.done} of ${summary.total}` : "None today",
    },
    {
      label: "Routine",
      color: RING_COLORS.routine,
      progress: routineTotal > 0 ? routineDoneCount / routineTotal : 0,
      value: routineTotal > 0 ? `${routineDoneCount} of ${routineTotal}` : "Not set up",
    },
    {
      label: "Check-in",
      color: RING_COLORS.checkin,
      progress: todayEntry ? 1 : 0,
      value: todayEntry ? "Done" : "Not yet",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <header className="animate-fade-up">
        <p className="text-sm font-semibold uppercase tracking-wide text-label-3">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-label">
          {greetingFor(now)}, {firstName(displayName)}
        </h1>
      </header>

      {/* Rings */}
      <Card className="animate-fade-up [animation-delay:60ms]">
        <CardBody className="flex items-center gap-6 p-6 sm:gap-8">
          {loading || routineItems.isLoading || wellness.isLoading ? (
            <Skeleton className="size-44 rounded-full bg-elev-2" />
          ) : (
            <ActivityRings
              size={176}
              rings={ringData.map(({ label, color, progress }) => ({
                label,
                color,
                progress,
              }))}
            />
          )}
          <dl className="flex-1 space-y-4">
            {ringData.map((ring) => (
              <div key={ring.label}>
                <dt className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-label-3">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: ring.color }}
                  />
                  {ring.label}
                </dt>
                <dd
                  className="text-xl font-bold"
                  style={{ color: ring.color }}
                >
                  {ring.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      {/* Today's schedule */}
      <section
        aria-labelledby="today-heading"
        className="animate-fade-up [animation-delay:120ms]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="today-heading" className="text-2xl font-bold text-label">
            Up next
          </h2>
          <SectionLink href="/reminders">All reminders</SectionLink>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : open.length === 0 ? (
          <div className="flex items-center gap-4 rounded-3xl bg-elev-1 p-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-white text-black">
              <Check className="size-6" aria-hidden="true" />
            </div>
            <p className="text-lg font-medium text-label">
              {summary.total === 0
                ? "No reminders scheduled for today."
                : "All caught up — nothing waiting on you."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {open.slice(0, 4).map((occurrence) => (
              <OccurrenceCard
                key={occurrence.reminder.id}
                occurrence={occurrence}
                busy={recordEvent.isPending}
                onAction={(action) =>
                  recordEvent.mutate(
                    { reminderId: occurrence.reminder.id, action },
                    {
                      onSuccess: () => {
                        if (action === "complete") toast("Nicely done!");
                        if (action === "snooze")
                          toast("Snoozed for 30 minutes.", "info");
                      },
                      onError: () =>
                        toast("Something went wrong. Please try again.", "error"),
                    },
                  )
                }
              />
            ))}
            {open.length > 4 && (
              <li className="text-center">
                <SectionLink href="/reminders">
                  {`${open.length - 4} more on the full list`}
                </SectionLink>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="animate-fade-up [animation-delay:180ms]">
        <ul className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="flex min-h-24 flex-col justify-between gap-2 rounded-3xl bg-elev-1 p-4 transition-colors hover:bg-elev-2"
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full",
                    action.tone,
                  )}
                >
                  <action.icon className="size-6" aria-hidden="true" />
                </span>
                <span className="text-base font-semibold text-label">
                  {action.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Wellness + coming up */}
      <Card className="animate-fade-up [animation-delay:240ms]">
        <CardHeader
          title="Wellness"
          action={<SectionLink href="/wellness">Open</SectionLink>}
        />
        <CardBody>
          {wellness.isLoading ? (
            <Skeleton className="h-24" />
          ) : todayEntry ? (
            <div className="space-y-3">
              {todayMood && (
                <p className="flex items-center gap-3 text-lg text-label-2">
                  <span className="text-3xl" aria-hidden="true">
                    {todayMood.emoji}
                  </span>
                  Feeling {todayMood.label.toLowerCase()} today
                </p>
              )}
              <dl className="grid grid-cols-2 gap-3 text-base">
                {todayEntry.sleep_hours != null && (
                  <div className="rounded-2xl bg-elev-2 p-3.5">
                    <dt className="text-sm text-label-3">Sleep</dt>
                    <dd className="text-lg font-bold text-label">
                      {Number(todayEntry.sleep_hours)} hours
                    </dd>
                  </div>
                )}
                {todayEntry.energy != null && (
                  <div className="rounded-2xl bg-elev-2 p-3.5">
                    <dt className="text-sm text-label-3">Energy</dt>
                    <dd className="text-lg font-bold text-label">
                      {todayEntry.energy} of 5
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div>
              <p className="text-base text-label-3">
                You haven&apos;t checked in yet today. It takes about 30
                seconds.
              </p>
              <Link
                href="/wellness"
                className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-base font-semibold text-black transition-all hover:bg-white/90"
              >
                <HeartPulse className="size-5" aria-hidden="true" />
                Check in now
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="animate-fade-up [animation-delay:300ms]">
        <CardHeader
          title="Coming up"
          action={<SectionLink href="/reminders">Open</SectionLink>}
        />
        <CardBody>
          {reminders.isLoading ? (
            <Skeleton className="h-24" />
          ) : upcoming.length === 0 ? (
            <p className="flex items-start gap-3 text-base text-label-3">
              <CalendarCheck
                className="mt-0.5 size-5 shrink-0 text-label-4"
                aria-hidden="true"
              />
              Nothing scheduled for the next few days.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {upcoming.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <BellRing
                    className="mt-1 size-5 shrink-0 text-label-4"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-label">
                      {item.title}
                    </p>
                    <p className="text-sm text-label-3">{item.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
