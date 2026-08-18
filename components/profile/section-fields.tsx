"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { SectionKey } from "@/lib/v2-types";

export const csv = (arr?: string[]) => (arr ?? []).join(", ");
export const toArr = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

const lines = (s: string) =>
  s.split("\n").map((x) => x.trim()).filter(Boolean);

/**
 * Fields for one section of the profile. `draft` is that section's value and
 * `set` replaces it — shared by the profile editor and the welcome survey.
 */
export function renderSection(
  key: SectionKey,
  draft: any,
  set: (v: any) => void,
) {
  const patch = (p: object) => set({ ...draft, ...p });

  switch (key) {
    case "identity":
      return (
        <>
          {textField("Your name", draft.legal_name, (v) => patch({ legal_name: v }))}
          {textField("What should Rekalla call you?", draft.preferred_name, (v) => patch({ preferred_name: v }), "A nickname is fine")}
          {dateField("Your birthday", draft.birthday, (v) => patch({ birthday: v }))}
          {textField("Where you're from", draft.hometown, (v) => patch({ hometown: v }))}
          {textField("What you did for work", draft.career, (v) => patch({ career: v }))}
          {textField("Religion or faith", draft.faith, (v) => patch({ faith: v }), "Only if you'd like to")}
        </>
      );
    case "interests":
      return (
        <>
          <p className="text-lg text-label-2">Add a few, separated by commas.</p>
          {textField("Hobbies", csv(draft.hobbies), (v) => patch({ hobbies: toArr(v) }))}
          {textField("Music you love", csv(draft.music), (v) => patch({ music: toArr(v) }))}
          {textField("Teams you follow", csv(draft.teams), (v) => patch({ teams: toArr(v) }))}
          {textField("Shows you watch", csv(draft.shows), (v) => patch({ shows: toArr(v) }))}
          {textField("Books you enjoy", csv(draft.books), (v) => patch({ books: toArr(v) }))}
        </>
      );
    case "preferences":
      return (
        <>
          <p className="text-xl font-semibold text-label">How should Rekalla talk with you?</p>
          <div className="flex gap-3">
            {(["chatty", "brief"] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                role="radio"
                aria-checked={draft.tone === tone}
                onClick={() => patch({ tone })}
                className={cn(
                  "min-h-16 flex-1 rounded-xl text-xl font-bold focus:outline-none focus:ring-[3px] focus:ring-white/25",
                  draft.tone === tone ? "bg-white text-black" : "bg-elev-2 text-label",
                )}
              >
                {tone === "chatty" ? "Chatty" : "Brief"}
              </button>
            ))}
          </div>
          {textField("Things you like to talk about", csv(draft.enjoy_topics), (v) => patch({ enjoy_topics: toArr(v) }))}
          {textField("Anything you'd rather not discuss", csv(draft.avoid_topics), (v) => patch({ avoid_topics: toArr(v) }), "Rekalla will steer clear of these")}
        </>
      );
    case "routine":
      return (
        <>
          <Field label="What a normal week looks like" hint="One thing per line — like Church on Sunday">
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                className="text-xl"
                value={(draft.typical_week ?? []).join("\n")}
                onChange={(e) => set({ ...draft, typical_week: lines(e.target.value) })}
              />
            )}
          </Field>
          <Field label="Regular plans" hint="One per line — like Bridge club Tuesdays or Sunday dinner with family">
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                className="text-xl"
                value={(draft.standing_commitments ?? []).map((c: any) => c.label ?? "").join("\n")}
                onChange={(e) =>
                  set({
                    ...draft,
                    standing_commitments: lines(e.target.value).map((label) => ({ label })),
                  })
                }
              />
            )}
          </Field>
        </>
      );
    case "people":
      return (
        <>
          <p className="text-lg text-label-2">
            Add your family, friends, and pets. Then you can ask things like
            &ldquo;when&apos;s my son&apos;s birthday?&rdquo; and Rekalla will know.
          </p>
          <RepeatList
            value={draft}
            onChange={set}
            fields={[
              ["name", "Name"],
              ["relationship", "How you're related (son, friend, dog…)"],
              ["birthday", "Their birthday (optional)", "date"],
              ["notes", "Anything to remember (optional)"],
            ]}
            addLabel="Add a person or pet"
          />
        </>
      );
    case "practical":
      return (
        <>
          <p className="text-lg text-label-2">
            A few details worth keeping handy — like your doctors, pharmacy, and
            who to call if something comes up.
          </p>
          <RepeatList
            value={draft.doctors}
            onChange={(doctors) => set({ ...draft, doctors })}
            fields={[["name", "Doctor's name"], ["specialty", "What they help with"]]}
            addLabel="Add a doctor"
          />
          {textField("Your pharmacy", draft.pharmacy, (v) => set({ ...draft, pharmacy: v }))}
          <p className="text-xl font-semibold text-label">Who to call in an emergency</p>
          <RepeatList
            value={draft.emergency_contacts}
            onChange={(emergency_contacts) => set({ ...draft, emergency_contacts })}
            fields={[["name", "Name"], ["phone", "Phone"], ["relationship", "How you're related"]]}
            addLabel="Add someone to call"
            priority
          />
        </>
      );
    default:
      return null;
  }
}

function textField(
  label: string,
  value: string | undefined,
  onChange: (v: string) => void,
  hint?: string,
) {
  return (
    <Field label={label} hint={hint}>
      {(p) => (
        <Input {...p} className="text-xl" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

// A tap-to-open calendar (native date picker) instead of typing a date out.
function dateField(
  label: string,
  value: string | undefined,
  onChange: (v: string) => void,
  hint?: string,
) {
  return (
    <Field label={label} hint={hint}>
      {(p) => (
        <Input
          {...p}
          type="date"
          className="text-xl"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

type RepeatField = [string, string] | [string, string, "text" | "date" | "tel"];

function RepeatList({
  value,
  onChange,
  fields,
  addLabel,
  priority,
}: {
  value?: any[];
  onChange: (v: any[]) => void;
  fields: RepeatField[];
  addLabel: string;
  priority?: boolean;
}) {
  const rows: any[] = Array.isArray(value) ? value : [];
  const update = (i: number, k: string, v: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div className="space-y-4">
      {rows.map((row, i) => (
        <div key={i} className="space-y-3 rounded-2xl bg-elev-1 p-4">
          {priority && <span className="text-lg font-extrabold text-tint-blue">#{i + 1}</span>}
          {fields.map(([k, label, type]) => (
            <Field key={k} label={label}>
              {(p) => (
                <Input
                  {...p}
                  type={type === "date" ? "date" : "text"}
                  className="text-xl"
                  inputMode={type === "tel" || k === "phone" ? "tel" : undefined}
                  value={row[k] ?? ""}
                  onChange={(e) => update(i, k, e.target.value)}
                />
              )}
            </Field>
          ))}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label={`Remove ${fields[0]?.[1] ?? "item"} ${i + 1}`}
          >
            <Trash2 className="size-5" aria-hidden="true" /> Remove
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="lg"
        className="w-full text-lg"
        onClick={() => onChange([...rows, priority ? { priority: rows.length + 1 } : {}])}
      >
        <Plus className="size-5" aria-hidden="true" /> {addLabel}
      </Button>
    </div>
  );
}
