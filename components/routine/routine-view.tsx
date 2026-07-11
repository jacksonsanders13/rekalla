"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, Plus, Sunrise, Trash2 } from "lucide-react";
import { ROUTINE_PERIODS } from "@/lib/constants";
import { cn, formatTimeOfDay, toDateKey } from "@/lib/utils";
import {
  routineItemSchema,
  type RoutineItemValues,
} from "@/lib/validations/routine";
import {
  useRoutineItems,
  useRoutineCompletions,
  useSaveRoutineItem,
  useDeleteRoutineItem,
  useToggleRoutineCompletion,
} from "@/hooks/use-routine";
import type { RoutineItem } from "@/types";
import type { RoutinePeriod } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";

const PERIOD_ORDER: RoutinePeriod[] = ["morning", "afternoon", "evening"];

function RoutineItemForm({
  item,
  saving,
  onSubmit,
  onCancel,
}: {
  item?: RoutineItem;
  saving: boolean;
  onSubmit: (values: RoutineItemValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoutineItemValues>({
    resolver: zodResolver(routineItemSchema),
    defaultValues: item
      ? {
          title: item.title,
          period: item.period,
          timeOfDay: item.time_of_day?.slice(0, 5) ?? "",
        }
      : { title: "", period: "morning", timeOfDay: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="What happens?" error={errors.title?.message} required>
        {(fieldProps) => (
          <Input
            placeholder="e.g. Morning walk in the garden"
            {...fieldProps}
            {...register("title")}
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Part of the day" error={errors.period?.message}>
          {(fieldProps) => (
            <Select {...fieldProps} {...register("period")}>
              {PERIOD_ORDER.map((period) => (
                <option key={period} value={period}>
                  {ROUTINE_PERIODS[period].label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Around what time? (optional)" error={errors.timeOfDay?.message}>
          {(fieldProps) => (
            <Input type="time" {...fieldProps} {...register("timeOfDay")} />
          )}
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {item ? "Save changes" : "Add to routine"}
        </Button>
      </div>
    </form>
  );
}

export function RoutineView({ userId }: { userId: string }) {
  const todayKey = toDateKey();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoutineItem | undefined>();
  const [deleting, setDeleting] = useState<RoutineItem | undefined>();

  const toast = useToast();
  const items = useRoutineItems(userId);
  const completions = useRoutineCompletions(userId, todayKey);
  const saveItem = useSaveRoutineItem(userId);
  const deleteItem = useDeleteRoutineItem(userId);
  const toggle = useToggleRoutineCompletion(userId, todayKey);

  const doneIds = useMemo(
    () => new Set((completions.data ?? []).map((c) => c.routine_item_id)),
    [completions.data],
  );

  const byPeriod = useMemo(() => {
    const groups: Record<RoutinePeriod, RoutineItem[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const item of items.data ?? []) groups[item.period].push(item);
    return groups;
  }, [items.data]);

  const total = items.data?.length ?? 0;
  const done = (items.data ?? []).filter((i) => doneIds.has(i.id)).length;

  function handleSubmit(values: RoutineItemValues) {
    saveItem.mutate(
      {
        id: editing?.id,
        values: {
          user_id: userId,
          title: values.title,
          period: values.period,
          time_of_day: values.timeOfDay || null,
        },
      },
      {
        onSuccess: () => {
          setFormOpen(false);
          setEditing(undefined);
          toast(editing ? "Routine updated." : "Added to your routine.");
        },
        onError: () => toast("Something went wrong. Please try again.", "error"),
      },
    );
  }

  const loading = items.isLoading || completions.isLoading;

  return (
    <div>
      <PageHeader
        title="Daily routine"
        description={
          total > 0
            ? `${done} of ${total} done today — one step at a time.`
            : "The gentle rhythm of your day, morning to evening."
        }
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-5" aria-hidden="true" />
            Add step
          </Button>
        }
      />

      {loading ? (
        <CardSkeleton rows={5} />
      ) : total === 0 ? (
        <EmptyState
          icon={Sunrise}
          title="No routine yet"
          description="Add the things you do every day — like breakfast, a walk, or evening medication — and check them off as you go."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-5" aria-hidden="true" />
              Build my routine
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {PERIOD_ORDER.map((period) => {
            const meta = ROUTINE_PERIODS[period];
            const periodItems = byPeriod[period];
            if (periodItems.length === 0) return null;
            return (
              <section key={period} aria-labelledby={`period-${period}`}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-tint-orange/15 text-tint-orange">
                    <meta.icon className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h2
                      id={`period-${period}`}
                      className="text-xl font-semibold text-label"
                    >
                      {meta.label}
                    </h2>
                    <p className="text-sm text-label-3">{meta.window}</p>
                  </div>
                </div>

                {/* Timeline */}
                <ol className="relative ml-5 space-y-3 border-l-2 border-white/15 pl-7">
                  {periodItems.map((item) => {
                    const isDone = doneIds.has(item.id);
                    return (
                      <li key={item.id} className="relative">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute -left-[38.5px] top-1/2 size-4 -translate-y-1/2 rounded-full border-2 transition-colors",
                            isDone
                              ? "border-white bg-white"
                              : "border-white/25 bg-elev-1",
                          )}
                        />
                        <div
                          className={cn(
                            "flex items-center gap-4 rounded-2xl bg-elev-1 p-4 transition-all hover:bg-elev-2",
                            isDone && "opacity-70",
                          )}
                        >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isDone}
                            aria-label={`${item.title} — mark as ${isDone ? "not done" : "done"}`}
                            disabled={toggle.isPending}
                            onClick={() =>
                              toggle.mutate({ itemId: item.id, done: !isDone })
                            }
                            className={cn(
                              "flex size-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
                              isDone
                                ? "border-white bg-white text-black"
                                : "border-white/25 bg-elev-2 text-transparent hover:border-white",
                            )}
                          >
                            <Check className="size-6" aria-hidden="true" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-lg font-medium text-label",
                                isDone && "line-through decoration-label-4",
                              )}
                            >
                              {item.title}
                            </p>
                            {item.time_of_day && (
                              <p className="text-base text-label-3">
                                around {formatTimeOfDay(item.time_of_day)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              aria-label={`Edit ${item.title}`}
                              onClick={() => {
                                setEditing(item);
                                setFormOpen(true);
                              }}
                              className="flex size-11 items-center justify-center rounded-xl text-label-4 transition-colors hover:bg-elev-2 hover:text-label-2"
                            >
                              <Pencil className="size-5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${item.title}`}
                              onClick={() => setDeleting(item)}
                              className="flex size-11 items-center justify-center rounded-xl text-label-4 transition-colors hover:bg-tint-red/10 hover:text-tint-red"
                            >
                              <Trash2 className="size-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}

      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        title={editing ? "Edit routine step" : "Add to your routine"}
      >
        {formOpen && (
          <RoutineItemForm
            item={editing}
            saving={saveItem.isPending}
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
        title="Remove this step?"
        description={
          deleting ? `"${deleting.title}" will be removed from your routine.` : undefined
        }
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleting(undefined)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={deleteItem.isPending}
            onClick={() =>
              deleting &&
              deleteItem.mutate(deleting.id, {
                onSuccess: () => {
                  setDeleting(undefined);
                  toast("Removed from your routine.", "info");
                },
                onError: () =>
                  toast("Something went wrong. Please try again.", "error"),
              })
            }
          >
            Remove step
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
