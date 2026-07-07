"use client";

import { useMemo, useState } from "react";
import { BellRing, Plus } from "lucide-react";
import { occurrencesFor, completionSummary } from "@/lib/reminders";
import { cn, toDateKey } from "@/lib/utils";
import {
  useReminders,
  useReminderEvents,
  useSaveReminder,
  useDeleteReminder,
  useRecordReminderEvent,
} from "@/hooks/use-reminders";
import type { Reminder } from "@/types";
import type { ReminderValues } from "@/lib/validations/reminder";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { ReminderForm } from "./reminder-form";
import { OccurrenceCard } from "./occurrence-card";
import { ReminderList } from "./reminder-list";

type Tab = "today" | "all";

export function RemindersView({
  userId,
  actorId,
  heading = "Reminders",
  description = "Everything on your list — check things off as you go.",
}: {
  /** Whose reminders these are. */
  userId: string;
  /** Who is making changes (differs when a caregiver manages a patient). */
  actorId: string;
  heading?: string;
  description?: string;
}) {
  const todayKey = toDateKey();
  const [tab, setTab] = useState<Tab>("today");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | undefined>();
  const [deleting, setDeleting] = useState<Reminder | undefined>();

  const toast = useToast();
  const reminders = useReminders(userId);
  const events = useReminderEvents(userId, todayKey);
  const saveReminder = useSaveReminder(userId);
  const deleteReminder = useDeleteReminder(userId);
  const recordEvent = useRecordReminderEvent(userId, todayKey);

  const occurrences = useMemo(
    () => occurrencesFor(reminders.data ?? [], events.data ?? [], todayKey),
    [reminders.data, events.data, todayKey],
  );
  const summary = completionSummary(occurrences);

  function handleSubmit(values: ReminderValues) {
    saveReminder.mutate(
      {
        id: editing?.id,
        values: {
          user_id: userId,
          created_by: actorId,
          title: values.title,
          description: values.description || null,
          category: values.category,
          time_of_day: values.timeOfDay,
          recurrence: values.recurrence,
          days_of_week: values.recurrence === "weekly" ? values.daysOfWeek : [],
          start_date: values.startDate,
          end_date: values.endDate || null,
        },
      },
      {
        onSuccess: () => {
          setFormOpen(false);
          setEditing(undefined);
          toast(editing ? "Reminder updated." : "Reminder added.");
        },
        onError: () => toast("Something went wrong. Please try again.", "error"),
      },
    );
  }

  function handleAction(
    reminderId: string,
    action: "complete" | "snooze" | "reopen",
  ) {
    recordEvent.mutate(
      { reminderId, action },
      {
        onSuccess: () => {
          if (action === "complete") toast("Nicely done!");
          if (action === "snooze") toast("Snoozed for 30 minutes.", "info");
        },
        onError: () => toast("Something went wrong. Please try again.", "error"),
      },
    );
  }

  const loading = reminders.isLoading || events.isLoading;

  return (
    <div>
      <PageHeader
        title={heading}
        description={description}
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-5" aria-hidden="true" />
            New reminder
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="Reminder views"
        className="mb-6 inline-flex rounded-2xl border border-sand-200 bg-white p-1.5 shadow-soft"
      >
        {(
          [
            { id: "today", label: `Today (${summary.done}/${summary.total})` },
            { id: "all", label: "All reminders" },
          ] as { id: Tab; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-12 rounded-xl px-5 text-base font-semibold transition-colors",
              tab === item.id
                ? "bg-sage-600 text-white shadow-soft"
                : "text-sand-700 hover:bg-sand-100",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton rows={4} />
      ) : tab === "today" ? (
        occurrences.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="Nothing scheduled today"
            description="Enjoy the quiet day, or add a reminder to get started."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-5" aria-hidden="true" />
                Add a reminder
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {occurrences.map((occurrence) => (
              <OccurrenceCard
                key={occurrence.reminder.id}
                occurrence={occurrence}
                busy={recordEvent.isPending}
                onAction={(action) =>
                  handleAction(occurrence.reminder.id, action)
                }
              />
            ))}
          </ul>
        )
      ) : (reminders.data ?? []).length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No reminders yet"
          description="Reminders you create will show up here, including ones added by your caregivers."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-5" aria-hidden="true" />
              Add your first reminder
            </Button>
          }
        />
      ) : (
        <ReminderList
          reminders={reminders.data ?? []}
          onEdit={(reminder) => {
            setEditing(reminder);
            setFormOpen(true);
          }}
          onDelete={setDeleting}
          onToggleActive={(reminder) =>
            saveReminder.mutate({
              id: reminder.id,
              values: { is_active: !reminder.is_active },
            })
          }
        />
      )}

      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        title={editing ? "Edit reminder" : "New reminder"}
        description={
          editing
            ? undefined
            : "We'll show it on the schedule at the right time."
        }
      >
        {formOpen && (
          <ReminderForm
            reminder={editing}
            saving={saveReminder.isPending}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditing(undefined);
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title="Delete this reminder?"
        description={
          deleting
            ? `"${deleting.title}" will be removed for good, along with its history.`
            : undefined
        }
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleting(undefined)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={deleteReminder.isPending}
            onClick={() =>
              deleting &&
              deleteReminder.mutate(deleting.id, {
                onSuccess: () => {
                  setDeleting(undefined);
                  toast("Reminder deleted.", "info");
                },
                onError: () =>
                  toast("Something went wrong. Please try again.", "error"),
              })
            }
          >
            Delete reminder
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
