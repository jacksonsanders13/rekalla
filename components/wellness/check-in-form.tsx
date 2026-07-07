"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MOOD_SCALE, ENERGY_SCALE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { WellnessEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface CheckInValues {
  mood: number | null;
  sleepHours: number | null;
  energy: number | null;
  notes: string;
}

/**
 * The daily check-in. Everything is buttons — no typing needed except the
 * optional note — because typing is the hard part for many older users.
 */
export function CheckInForm({
  entry,
  saving,
  onSubmit,
}: {
  entry?: WellnessEntry | null;
  saving: boolean;
  onSubmit: (values: CheckInValues) => void;
}) {
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [sleep, setSleep] = useState<number | null>(
    entry?.sleep_hours != null ? Number(entry.sleep_hours) : null,
  );
  const [energy, setEnergy] = useState<number | null>(entry?.energy ?? null);
  const [notes, setNotes] = useState(entry?.notes ?? "");

  function adjustSleep(delta: number) {
    setSleep((current) => {
      const next = (current ?? 7) + delta;
      return Math.min(24, Math.max(0, Math.round(next * 2) / 2));
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ mood, sleepHours: sleep, energy, notes });
      }}
      className="space-y-7"
    >
      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-sand-950">
          How are you feeling today?
        </legend>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {MOOD_SCALE.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mood === option.value}
              onClick={() =>
                setMood(mood === option.value ? null : option.value)
              }
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 transition-all",
                mood === option.value
                  ? "border-sage-600 bg-sage-50 shadow-soft"
                  : "border-sand-200 bg-white hover:border-sand-300",
              )}
            >
              <span className="text-3xl" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-xs font-medium text-sand-700 sm:text-sm">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-sand-950">
          How did you sleep last night?
        </legend>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Half an hour less sleep"
            onClick={() => adjustSleep(-0.5)}
            className="flex size-14 items-center justify-center rounded-2xl border border-sand-200 bg-white text-sand-700 shadow-soft transition-colors hover:border-sand-300 hover:bg-sand-50"
          >
            <Minus className="size-6" aria-hidden="true" />
          </button>
          <output
            aria-live="polite"
            className="min-w-32 text-center text-2xl font-semibold text-sand-950"
          >
            {sleep === null ? "—" : `${sleep} hours`}
          </output>
          <button
            type="button"
            aria-label="Half an hour more sleep"
            onClick={() => adjustSleep(0.5)}
            className="flex size-14 items-center justify-center rounded-2xl border border-sand-200 bg-white text-sand-700 shadow-soft transition-colors hover:border-sand-300 hover:bg-sand-50"
          >
            <Plus className="size-6" aria-hidden="true" />
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-sand-950">
          How is your energy?
        </legend>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {ENERGY_SCALE.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={energy === option.value}
              aria-label={`Energy level ${option.value} of 5 — ${option.label}`}
              onClick={() =>
                setEnergy(energy === option.value ? null : option.value)
              }
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all",
                energy === option.value
                  ? "border-sage-600 bg-sage-50 shadow-soft"
                  : "border-sand-200 bg-white hover:border-sand-300",
              )}
            >
              <span className="flex items-end gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <span
                    key={bar}
                    className={cn(
                      "w-1.5 rounded-full",
                      bar <= option.value ? "bg-sage-600" : "bg-sand-200",
                    )}
                    style={{ height: `${6 + bar * 3}px` }}
                  />
                ))}
              </span>
              <span className="hidden text-xs font-medium text-sand-700 sm:block">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="daily-note"
          className="mb-3 block text-lg font-semibold text-sand-950"
        >
          Anything you&apos;d like to note? (optional)
        </label>
        <Textarea
          id="daily-note"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={1000}
          placeholder="e.g. Lovely phone call with Daniel this morning."
        />
      </div>

      <Button type="submit" size="lg" loading={saving} className="w-full sm:w-auto">
        {entry ? "Update today's check-in" : "Save today's check-in"}
      </Button>
    </form>
  );
}
