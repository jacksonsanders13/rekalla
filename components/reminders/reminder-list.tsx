"use client";

import { Pencil, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { reminderCategoryMeta } from "@/lib/constants";
import { describeSchedule } from "@/lib/reminders";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";
import { Badge } from "@/components/ui/badge";

/**
 * List of reminders with schedule summaries. Shows edit/pause/delete controls
 * when the viewer can manage; otherwise it's a read-only list (patient view).
 */
export function ReminderList({
  reminders,
  onEdit,
  onDelete,
  onToggleActive,
  readOnly = false,
}: {
  reminders: Reminder[];
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
  onToggleActive?: (reminder: Reminder) => void;
  readOnly?: boolean;
}) {
  return (
    <ul className="space-y-4">
      {reminders.map((reminder) => {
        const meta = reminderCategoryMeta(reminder.category);
        return (
          <li
            key={reminder.id}
            className={cn(
              "flex flex-wrap items-center gap-4 rounded-2xl bg-elev-1 p-5 transition-colors hover:bg-elev-2",
              !reminder.is_active && "opacity-60",
            )}
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-elev-2 text-label-3">
              <meta.icon className="size-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-label">
                {reminder.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-label-3">
                <span>{describeSchedule(reminder)}</span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {!reminder.is_active && <Badge>Paused</Badge>}
              </div>
            </div>
            {!readOnly && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label={
                    reminder.is_active
                      ? `Pause ${reminder.title}`
                      : `Resume ${reminder.title}`
                  }
                  onClick={() => onToggleActive?.(reminder)}
                  className="flex size-12 items-center justify-center rounded-xl text-label-3 transition-colors hover:bg-elev-2 hover:text-label-2"
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
                  onClick={() => onEdit?.(reminder)}
                  className="flex size-12 items-center justify-center rounded-xl text-label-3 transition-colors hover:bg-elev-2 hover:text-label-2"
                >
                  <Pencil className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${reminder.title}`}
                  onClick={() => onDelete?.(reminder)}
                  className="flex size-12 items-center justify-center rounded-xl text-label-3 transition-colors hover:bg-tint-red/10 hover:text-tint-red"
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
