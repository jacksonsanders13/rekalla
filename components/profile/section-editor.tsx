"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useProfileV2, useSaveSection } from "@/hooks/use-assistant-v2";
import { SECTION_LABELS, type SectionKey } from "@/lib/v2-types";

const csv = (arr?: string[]) => (arr ?? []).join(", ");
const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function SectionEditor({ userId, section }: { userId: string; section: SectionKey }) {
  const router = useRouter();
  const { data: profile } = useProfileV2(userId);
  const save = useSaveSection(userId, userId);
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (profile && draft === null) setDraft(JSON.parse(JSON.stringify(profile[section])));
  }, [profile, draft, section]);

  if (!profile || draft === null) {
    return <p className="text-xl text-label-3">Loading…</p>;
  }

  function onSave() {
    save.mutate({ section, value: draft }, { onSuccess: () => router.push("/profile") });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-label">{SECTION_LABELS[section]}</h1>
      <div className="space-y-5">{renderSection(section, draft, setDraft)}</div>
      <Button size="lg" className="w-full text-xl" onClick={onSave} loading={save.isPending}>
        <Check className="size-6" aria-hidden="true" /> Save
      </Button>
    </div>
  );
}

function renderSection(key: SectionKey, draft: any, set: (v: any) => void) {
  const patch = (p: object) => set({ ...draft, ...p });
  const bigText = "text-xl";

  switch (key) {
    case "identity":
      return (
        <>
          {textField("Legal name", draft.legal_name, (v) => patch({ legal_name: v }))}
          {textField("Preferred name", draft.preferred_name, (v) => patch({ preferred_name: v }), "What should Rekalla call you?")}
          {textField("Your birthday", draft.birthday, (v) => patch({ birthday: v }), "For example: March 4, 1946")}
          {textField("Hometown", draft.hometown, (v) => patch({ hometown: v }))}
          {textField("Career or work", draft.career, (v) => patch({ career: v }))}
          {textField("Faith (only if you'd like to share)", draft.faith, (v) => patch({ faith: v }))}
        </>
      );
    case "interests":
      return (
        <>
          <p className="text-lg text-label-2">Separate items with commas.</p>
          {textField("Hobbies", csv(draft.hobbies), (v) => patch({ hobbies: toArr(v) }))}
          {textField("Music", csv(draft.music), (v) => patch({ music: toArr(v) }))}
          {textField("Teams", csv(draft.teams), (v) => patch({ teams: toArr(v) }))}
          {textField("Shows", csv(draft.shows), (v) => patch({ shows: toArr(v) }))}
          {textField("Books", csv(draft.books), (v) => patch({ books: toArr(v) }))}
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
          {textField("Topics you enjoy", csv(draft.enjoy_topics), (v) => patch({ enjoy_topics: toArr(v) }), "Comma separated")}
          {textField("Topics to avoid", csv(draft.avoid_topics), (v) => patch({ avoid_topics: toArr(v) }), "Rekalla will never bring these up")}
        </>
      );
    case "routine":
      return (
        <>
          <Field label="A typical week" hint="One thing per line (e.g. Church on Sunday)">
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                className={bigText}
                value={(draft.typical_week ?? []).join("\n")}
                onChange={(e) =>
                  set({ ...draft, typical_week: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })
                }
              />
            )}
          </Field>
          <Field
            label="Standing commitments"
            hint="Logistics only, one per line (e.g. Bridge club Tuesday 2pm). Not health details."
          >
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                className={bigText}
                value={(draft.standing_commitments ?? []).map((c: any) => c.label ?? "").join("\n")}
                onChange={(e) =>
                  set({
                    ...draft,
                    standing_commitments: e.target.value
                      .split("\n")
                      .map((x) => x.trim())
                      .filter(Boolean)
                      .map((label) => ({ label })),
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
            Add your family, friends, and pets — names, how they&apos;re related,
            and their birthdays. Rekalla uses this to answer questions like
            &ldquo;when&apos;s my son&apos;s birthday?&rdquo;
          </p>
          <RepeatList
            value={draft}
            onChange={set}
            fields={[
              ["name", "Name"],
              ["relationship", "Relationship (e.g. son, friend, dog)"],
              ["birthday", "Birthday (optional)"],
              ["notes", "Anything to remember (optional)"],
            ]}
            addLabel="Add a person or pet"
          />
        </>
      );
    case "practical":
      return (
        <>
          <p className="text-lg text-label-2">Doctor names and specialty only — never conditions.</p>
          <RepeatList
            value={draft.doctors}
            onChange={(doctors) => set({ ...draft, doctors })}
            fields={[["name", "Doctor's name"], ["specialty", "Specialty"]]}
            addLabel="Add a doctor"
          />
          {textField("Pharmacy", draft.pharmacy, (v) => set({ ...draft, pharmacy: v }))}
          <p className="text-xl font-semibold text-label">Emergency contacts (priority order)</p>
          <RepeatList
            value={draft.emergency_contacts}
            onChange={(emergency_contacts) => set({ ...draft, emergency_contacts })}
            fields={[["name", "Name"], ["phone", "Phone"], ["relationship", "Relationship"]]}
            addLabel="Add an emergency contact"
            priority
          />
        </>
      );
    default:
      return <p className="text-xl text-label-2">Coming soon.</p>;
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

function RepeatList({
  value,
  onChange,
  fields,
  addLabel,
  priority,
}: {
  value?: any[];
  onChange: (v: any[]) => void;
  fields: [string, string][];
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
          {fields.map(([k, label]) => (
            <Field key={k} label={label}>
              {(p) => (
                <Input
                  {...p}
                  className="text-xl"
                  inputMode={k === "phone" ? "tel" : undefined}
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
