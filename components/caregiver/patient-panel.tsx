"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Mail, Plus } from "lucide-react";
import { occurrencesFor, completionSummary } from "@/lib/reminders";
import { firstName, toDateKey } from "@/lib/utils";
import {
  useReminders,
  useReminderEvents,
  useSaveReminder,
  useDeleteReminder,
} from "@/hooks/use-reminders";
import { useQueueMissedAlert } from "@/hooks/use-care";
import type { Profile, Reminder } from "@/types";
import type { ReminderValues } from "@/lib/validations/reminder";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { OccurrenceCard } from "@/components/reminders/occurrence-card";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { ReminderList } from "@/components/reminders/reminder-list";
import { WellnessView } from "@/components/wellness/wellness-view";

/**
 * Everything a caregiver needs about one person: today's schedule, missed
 * reminders, wellness history, and the ability to manage their reminders.
 */
export function PatientPanel({
  patient,
  caregiverId,
  onBack,
}: {
  patient: Profile;
  caregiverId: string;
  onBack: () => void;
}) {
  const todayKey = toDateKey();
  const name = firstName(patient.full_name);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | undefined>();
  const [deleting, setDeleting] = useState<Reminder | undefined>();

  const reminders = useReminders(patient.id);
  const events = useReminderEvents(patient.id, todayKey);
  const saveReminder = useSaveReminder(patient.id);
  const deleteReminder = useDeleteReminder(patient.id);
  const missedAlert = useQueueMissedAlert();

  const occurrences = useMemo(
    () => occurrencesFor(reminders.data ?? [], events.data ?? [], todayKey),
    [reminders.data, events.data, todayKey],
  );
  const summary = completionSummary(occurrences);
  const missed = occurrences.filter((o) => o.status === "overdue");

  function handleSubmit(values: ReminderValues) {
    saveReminder.mutate(
      {
        id: editing?.id,
        values: {
          user_id: patient.id,
          created_by: caregiverId,
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
          toast(editing ? "Reminder updated." : `Reminder added for ${name}.`);
        },
        onError: () => toast("Something went wrong. Please try again.", "error"),
      },
    );
  }

  const loading = reminders.isLoading || events.isLoading;

  return (
    <div className="space-y-10">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          All people
        </button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-label">
              Caring for {patient.full_name}
            </h1>
            <p className="mt-1.5 text-lg text-label-3">
              {loading
                ? "Loading today…"
                : summary.total === 0
                  ? "No reminders scheduled today."
                  : `${summary.done} of ${summary.total} reminders done today.`}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-5" aria-hidden="true" />
            Add reminder for {name}
          </Button>
        </div>
      </div>

      {/* Missed reminders alert */}
      {!loading && missed.length > 0 && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-tint-red/30 bg-tint-red/10 p-6"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-tint-red/15 text-tint-red">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-tint-red">
              {missed.length} reminder{missed.length === 1 ? "" : "s"} not done
              yet
            </p>
            <p className="mt-0.5 text-base text-tint-red/80">
              {missed.map((o) => o.reminder.title).join(" · ")}
            </p>
          </div>
          <Button
            variant="secondary"
            loading={missedAlert.isPending}
            onClick={() =>
              missedAlert.mutate(
                {
                  caregiverId,
                  patientName: patient.full_name,
                  missedTitles: missed.map((o) => o.reminder.title),
                },
                {
                  onSuccess: () =>
                    toast("Alert sent to your email (mock delivery).", "info"),
                  onError: () =>
                    toast("Couldn't send the alert. Please try again.", "error"),
                },
              )
            }
          >
            <Mail className="size-5" aria-hidden="true" />
            Email me this
          </Button>
        </div>
      )}

      {/* Today, read-only */}
      <section aria-labelledby="patient-today">
        <h2
          id="patient-today"
          className="mb-4 text-2xl font-semibold text-label"
        >
          Today&apos;s schedule
        </h2>
        {loading ? (
          <CardSkeleton rows={3} />
        ) : occurrences.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-elev-1/60 p-6 text-base text-label-3">
            Nothing scheduled for {name} today.
          </p>
        ) : (
          <ul className="space-y-4">
            {occurrences.map((occurrence) => (
              <OccurrenceCard
                key={occurrence.reminder.id}
                occurrence={occurrence}
                readOnly
              />
            ))}
          </ul>
        )}
      </section>

      {/* Manage reminders */}
      <section aria-labelledby="patient-reminders">
        <h2
          id="patient-reminders"
          className="mb-4 text-2xl font-semibold text-label"
        >
          {name}&apos;s reminders
        </h2>
        {loading ? (
          <CardSkeleton rows={3} />
        ) : (reminders.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-elev-1/60 p-6 text-base text-label-3">
            No reminders yet — add the first one for {name}.
          </p>
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
      </section>

      {/* Wellness history, read-only */}
      <WellnessView
        userId={patient.id}
        readOnly
        heading={`${name}'s wellness`}
        description={`How ${name} has been feeling lately.`}
      />

      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        title={editing ? "Edit reminder" : `New reminder for ${name}`}
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
            ? `"${deleting.title}" will be removed from ${name}'s schedule.`
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
