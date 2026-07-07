"use client";

import { Pencil, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { REMINDER_CATEGORIES } from "@/lib/constants";
import { describeSchedule } from "@/lib/reminders";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";
import { Badge } from "@/components/ui/badge";

/** Management list of reminders: schedule summary plus edit/pause/delete. */
export function ReminderList({
  reminders,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  reminders: Reminder[];
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
  onToggleActive: (reminder: Reminder) => void;
}) {
  return (
    <ul className="space-y-4">
      {reminders.map((reminder) => {
        const meta = REMINDER_CATEGORIES[reminder.category];
        return (
          <li
            key={reminder.id}
            className={cn(
              "flex flex-wrap items-center gap-4 rounded-2xl border border-sand-100 bg-white p-5 shadow-soft transition-shadow hover:shadow-lifted",
              !reminder.is_active && "opacity-60",
            )}
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-sand-600">
              <meta.icon className="size-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-sand-950">
                {reminder.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-sand-600">
                <span>{describeSchedule(reminder)}</span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {!reminder.is_active && <Badge>Paused</Badge>}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                aria-label={
                  reminder.is_active
                    ? `Pause ${reminder.title}`
                    : `Resume ${reminder.title}`
                }
                onClick={() => onToggleActive(reminder)}
                className="flex size-12 items-center justify-center rounded-xl text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
              >
                {reminder.is_active ? (
                  <PauseCircle className="size-6" aria-hidden="true" />
                ) : (
                  <PlayCircle className="size-6" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label={`Edit ${reminder.title}`}
                onClick={() => onEdit(reminder)}
                className="flex size-12 items-center justify-center rounded-xl text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
              >
                <Pencil className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${reminder.title}`}
                onClick={() => onDelete(reminder)}
                className="flex size-12 items-center justify-center rounded-xl text-sand-500 transition-colors hover:bg-clay-50 hover:text-clay-600"
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
