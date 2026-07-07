"use client";

import { useMemo } from "react";
import { HeartPulse } from "lucide-react";
import { MOOD_SCALE } from "@/lib/constants";
import { toDateKey, fromDateKey } from "@/lib/utils";
import { useWellnessEntries, useSaveWellnessEntry } from "@/hooks/use-wellness";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { TrendChart } from "./trend-chart";
import { CheckInForm, type CheckInValues } from "./check-in-form";

// Chart accents are deliberately more saturated than the UI palette so the
// marks don't read as gray (validated for contrast + CVD separation).
export const CHART_COLORS = {
  mood: "#2f8f5b",
  sleep: "#3a6fd0",
  energy: "#b3489f",
} as const;

export function moodLabel(value: number): string {
  return MOOD_SCALE.find((m) => m.value === Math.round(value))?.label ?? String(value);
}

export function WellnessView({
  userId,
  readOnly = false,
  heading = "Wellness",
  description = "A quick daily check-in, and the story it tells over time.",
}: {
  userId: string;
  readOnly?: boolean;
  heading?: string;
  description?: string;
}) {
  const todayKey = toDateKey();
  const toast = useToast();
  const entries = useWellnessEntries(userId, 30);
  const save = useSaveWellnessEntry(userId);

  const today = useMemo(
    () => (entries.data ?? []).find((e) => e.entry_date === todayKey) ?? null,
    [entries.data, todayKey],
  );

  const series = useMemo(() => {
    const data = entries.data ?? [];
    return {
      mood: data
        .filter((e) => e.mood != null)
        .map((e) => ({ dateKey: e.entry_date, value: e.mood! })),
      sleep: data
        .filter((e) => e.sleep_hours != null)
        .map((e) => ({ dateKey: e.entry_date, value: Number(e.sleep_hours) })),
      energy: data
        .filter((e) => e.energy != null)
        .map((e) => ({ dateKey: e.entry_date, value: e.energy! })),
      notes: data
        .filter((e) => e.notes)
        .slice(-5)
        .reverse(),
    };
  }, [entries.data]);

  function handleSubmit(values: CheckInValues) {
    if (values.mood === null && values.sleepHours === null && values.energy === null && !values.notes.trim()) {
      toast("Pick at least one thing to record first.", "info");
      return;
    }
    save.mutate(
      {
        entryDate: todayKey,
        mood: values.mood,
        sleepHours: values.sleepHours,
        energy: values.energy,
        notes: values.notes.trim() || null,
      },
      {
        onSuccess: () => toast("Check-in saved. Have a lovely day!"),
        onError: () => toast("Something went wrong. Please try again.", "error"),
      },
    );
  }

  if (entries.isLoading) {
    return (
      <div>
        <PageHeader title={heading} description={description} />
        <div className="space-y-6">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={2} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={heading} description={description} />

      <div className="space-y-6">
        {!readOnly && (
          <Card className="animate-fade-up">
            <CardHeader
              title={today ? "Today's check-in ✓" : "Today's check-in"}
            />
            <CardBody>
              <CheckInForm
                key={today?.updated_at ?? "new"}
                entry={today}
                saving={save.isPending}
                onSubmit={handleSubmit}
              />
            </CardBody>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="animate-fade-up">
            <CardHeader title="Mood" />
            <CardBody>
              <TrendChart
                title="Mood"
                unit=""
                points={series.mood}
                color={CHART_COLORS.mood}
                domain={[1, 5]}
                formatValue={moodLabel}
              />
            </CardBody>
          </Card>

          <Card className="animate-fade-up [animation-delay:60ms]">
            <CardHeader title="Sleep" />
            <CardBody>
              <TrendChart
                title="Sleep"
                unit="hours"
                points={series.sleep}
                color={CHART_COLORS.sleep}
                domain={[0, 12]}
                formatValue={(v) => `${v}h`}
              />
            </CardBody>
          </Card>

          <Card className="animate-fade-up [animation-delay:120ms]">
            <CardHeader title="Energy" />
            <CardBody>
              <TrendChart
                title="Energy"
                unit="of 5"
                points={series.energy}
                color={CHART_COLORS.energy}
                domain={[1, 5]}
              />
            </CardBody>
          </Card>

          <Card className="animate-fade-up [animation-delay:180ms]">
            <CardHeader title="Recent notes" />
            <CardBody>
              {series.notes.length === 0 ? (
                <p className="flex h-44 items-center justify-center text-center text-base text-sand-500">
                  Notes from daily check-ins will appear here.
                </p>
              ) : (
                <ul className="space-y-4">
                  {series.notes.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-sage-200 pl-4">
                      <p className="text-sm font-medium text-sand-500">
                        {fromDateKey(entry.entry_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="mt-0.5 text-base text-sand-800">{entry.notes}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {readOnly && series.mood.length === 0 && series.sleep.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-sand-100/60 p-5 text-base text-sand-700">
            <HeartPulse className="size-6 shrink-0 text-sand-500" aria-hidden="true" />
            No check-ins recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
