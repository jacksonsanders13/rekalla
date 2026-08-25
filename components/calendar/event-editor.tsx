"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useUpdateReminder,
  useDeleteReminder,
  type Reminder,
} from "@/hooks/use-scans";

/**
 * Edit one event. Anything Rekalla read off a photo can be corrected here —
 * what it is, which day, what time, and any note — or removed altogether.
 */
export function EventEditor({
  reminder,
  userId,
  open,
  onClose,
}: {
  reminder: Reminder;
  userId: string;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateReminder(userId);
  const remove = useDeleteReminder(userId);

  const [title, setTitle] = useState(reminder.title);
  const [date, setDate] = useState(reminder.start_date);
  const [allDay, setAllDay] = useState(!reminder.time_of_day);
  const [time, setTime] = useState((reminder.time_of_day ?? "09:00:00").slice(0, 5));
  const [note, setNote] = useState(reminder.description ?? "");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the dialog is opened on a (possibly new) event.
  useEffect(() => {
    if (!open) return;
    setTitle(reminder.title);
    setDate(reminder.start_date);
    setAllDay(!reminder.time_of_day);
    setTime((reminder.time_of_day ?? "09:00:00").slice(0, 5));
    setNote(reminder.description ?? "");
    setConfirming(false);
    setError(null);
  }, [open, reminder]);

  async function save() {
    setError(null);
    try {
      await update.mutateAsync({
        id: reminder.id,
        edits: {
          title: title.trim() || "Reminder",
          start_date: date,
          time_of_day: allDay ? null : `${time}:00`,
          description: note.trim() || null,
        },
      });
      onClose();
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Please try again.");
    }
  }

  async function destroy() {
    setError(null);
    try {
      await remove.mutateAsync(reminder.id);
      onClose();
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Please try again.");
    }
  }

  const busy = update.isPending || remove.isPending;

  return (
    <Dialog open={open} onClose={onClose} title="Edit">
      <div className="space-y-5">
        <Field label="What is it?">
          {(props) => (
            <Input {...props} value={title} onChange={(e) => setTitle(e.target.value)} />
          )}
        </Field>

        <Field label="Day">
          {(props) => (
            <Input {...props} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
        </Field>

        <div className="space-y-2">
          <label className="flex min-h-11 items-center gap-3 text-base font-semibold text-label-2">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-5 accent-white"
            />
            All day
          </label>
          {!allDay && (
            <Field label="Time">
              {(props) => (
                <Input
                  {...props}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              )}
            </Field>
          )}
        </div>

        <Field label="Note (optional)">
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Where it is, who to bring, an amount…"
            />
          )}
        </Field>

        {error && (
          <p role="alert" className="text-base font-medium text-tint-red">
            Didn&apos;t save: {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={save} loading={update.isPending} disabled={busy}>
            Save
          </Button>
          {confirming ? (
            <div className="space-y-3 rounded-2xl bg-elev-1 p-4">
              <p className="text-base text-label-2">
                Remove this event? It will come off your calendar and you won&apos;t be
                reminded.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
                  Keep it
                </Button>
                <Button variant="danger" onClick={destroy} loading={remove.isPending}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger-ghost" onClick={() => setConfirming(true)} disabled={busy}>
              Remove this event
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
