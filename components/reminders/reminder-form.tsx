"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { REMINDER_CATEGORIES } from "@/lib/constants";
import { toDateKey, cn } from "@/lib/utils";
import { reminderSchema, type ReminderValues } from "@/lib/validations/reminder";
import type { Reminder } from "@/types";
import type { ReminderCategory } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function toFormValues(reminder?: Reminder): ReminderValues {
  if (!reminder) {
    return {
      title: "",
      description: "",
      category: "custom",
      timeOfDay: "09:00",
      recurrence: "once",
      daysOfWeek: [],
      startDate: toDateKey(),
      endDate: "",
    };
  }
  return {
    title: reminder.title,
    description: reminder.description ?? "",
    category: reminder.category,
    timeOfDay: reminder.time_of_day.slice(0, 5),
    recurrence: reminder.recurrence,
    daysOfWeek: reminder.days_of_week,
    startDate: reminder.start_date,
    endDate: reminder.end_date ?? "",
  };
}

export function ReminderForm({
  reminder,
  saving,
  onSubmit,
  onCancel,
}: {
  reminder?: Reminder;
  saving: boolean;
  onSubmit: (values: ReminderValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ReminderValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: toFormValues(reminder),
  });

  const recurrence = watch("recurrence");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="What should we remind you about?" error={errors.title?.message} required>
        {(fieldProps) => (
          <Input
            placeholder="e.g. Take morning medication"
            {...fieldProps}
            {...register("title")}
          />
        )}
      </Field>

      <Field
        label="Category"
        error={errors.category?.message}
      >
        {(fieldProps) => (
          <Select {...fieldProps} {...register("category")}>
            {(
              Object.entries(REMINDER_CATEGORIES) as [
                ReminderCategory,
                (typeof REMINDER_CATEGORIES)[ReminderCategory],
              ][]
            ).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="At what time?" error={errors.timeOfDay?.message} required>
          {(fieldProps) => (
            <Input type="time" {...fieldProps} {...register("timeOfDay")} />
          )}
        </Field>

        <Field label="How often?" error={errors.recurrence?.message}>
          {(fieldProps) => (
            <Select {...fieldProps} {...register("recurrence")}>
              <option value="once">Just once</option>
              <option value="daily">Every day</option>
              <option value="weekly">Certain days of the week</option>
              <option value="monthly">Once a month</option>
            </Select>
          )}
        </Field>
      </div>

      {recurrence === "weekly" && (
        <Controller
          control={control}
          name="daysOfWeek"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-2 block text-base font-semibold text-label">
                On which days?
              </legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const selected = field.value.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((d) => d !== day.value)
                            : [...field.value, day.value],
                        )
                      }
                      className={cn(
                        "min-h-12 min-w-14 rounded-xl border px-3 text-base font-semibold transition-colors",
                        selected
                          ? "border-white bg-white text-black"
                          : "border-white/15 bg-elev-2 text-label-2 hover:border-white/25",
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {errors.daysOfWeek && (
                <p role="alert" className="mt-2 text-sm font-medium text-tint-red">
                  {errors.daysOfWeek.message}
                </p>
              )}
            </fieldset>
          )}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={recurrence === "once" ? "On which day?" : "Starting from"}
          error={errors.startDate?.message}
          required
        >
          {(fieldProps) => (
            <Input type="date" {...fieldProps} {...register("startDate")} />
          )}
        </Field>

        {recurrence !== "once" && (
          <Field
            label="Until (optional)"
            error={errors.endDate?.message}
          >
            {(fieldProps) => (
              <Input type="date" {...fieldProps} {...register("endDate")} />
            )}
          </Field>
        )}
      </div>

      <Field label="Notes (optional)" error={errors.description?.message}>
        {(fieldProps) => (
          <Textarea
            placeholder="Anything helpful to remember, like 'take with food'."
            {...fieldProps}
            {...register("description")}
          />
        )}
      </Field>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {reminder ? "Save changes" : "Add reminder"}
        </Button>
      </div>
    </form>
  );
}
