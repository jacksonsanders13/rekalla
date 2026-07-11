"use client";

import { Check, Clock3, RotateCcw, AlarmClock } from "lucide-react";
import { REMINDER_CATEGORIES } from "@/lib/constants";
import { cn, formatTimeOfDay } from "@/lib/utils";
import type { ReminderOccurrence } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * A single reminder for today: what it is, when it's due, and the two big
 * actions that matter — Done and Snooze.
 */
export function OccurrenceCard({
  occurrence,
  onAction,
  busy,
  readOnly = false,
}: {
  occurrence: ReminderOccurrence;
  onAction?: (action: "complete" | "snooze" | "reopen") => void;
  busy?: boolean;
  readOnly?: boolean;
}) {
  const { reminder, status, event } = occurrence;
  const meta = REMINDER_CATEGORIES[reminder.category];
  const done = status === "completed";
  const snoozed = status === "snoozed";
  const overdue = status === "overdue";

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-2xl border bg-elev-1 p-5 transition-all",
        done ? "border-white/10 opacity-70" : "border-white/10 hover:bg-elev-2",
        overdue && "border-tint-red/30 bg-tint-red/10",
      )}
    >
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl",
          done ? "bg-white/10 text-white" : "bg-elev-2 text-label-3",
        )}
      >
        {done ? (
          <Check className="size-6" aria-hidden="true" />
        ) : (
          <meta.icon className="size-6" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-lg font-semibold text-label",
            done && "line-through decoration-label-4",
          )}
        >
          {reminder.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-label-3">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-5" aria-hidden="true" />
            {formatTimeOfDay(reminder.time_of_day)}
          </span>
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {overdue && !event && (
            <span className="font-medium text-tint-red">Still waiting</span>
          )}
          {snoozed && event?.snoozed_until && (
            <span className="font-medium text-tint-orange">
              Snoozed until{" "}
              {new Date(event.snoozed_until).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        {reminder.description && !done && (
          <p className="mt-1.5 text-base text-label-3">{reminder.description}</p>
        )}
      </div>

      {!readOnly && onAction && (
        <div className="flex w-full gap-2.5 sm:w-auto">
          {done ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onAction("reopen")}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Undo
            </Button>
          ) : (
            <>
              <Button
                className="flex-1 sm:flex-none"
                disabled={busy}
                onClick={() => onAction("complete")}
              >
                <Check className="size-5" aria-hidden="true" />
                Done
              </Button>
              {!snoozed && (
                <Button
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                  disabled={busy}
                  onClick={() => onAction("snooze")}
                >
                  <AlarmClock className="size-5" aria-hidden="true" />
                  Snooze
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}
