/**
 * Per-section profile editor. One section at a time (chunked, resumable).
 * Reached from the profile overview; two nav levels total from home.
 * Every free-text field supports keyboard dictation (voice input, Part D).
 */
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSession } from "../lib/session";
import { colors, radius } from "../lib/theme";
import { a11y, a11yFont } from "../lib/a11y";
import { BigButton, BigField, BodyText } from "../components/big-ui";
import { useProfile, useSaveSection } from "../hooks/v2";
import {
  SECTION_LABELS,
  type ProfilePerson,
  type SectionKey,
} from "../lib/v2-types";

const csv = (arr?: string[]) => (arr ?? []).join(", ");
const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function ProfileSectionEditor() {
  const { section } = useLocalSearchParams<{ section: SectionKey }>();
  const key = (section ?? "identity") as SectionKey;
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();
  const { data: profile } = useProfile(userId);
  const save = useSaveSection(userId, userId);

  // Local draft, seeded from the loaded profile.
  const [draft, setDraft] = useState<any>(null);
  useEffect(() => {
    if (profile && draft === null) setDraft(JSON.parse(JSON.stringify(profile[key])));
  }, [profile]);

  if (!profile || draft === null) {
    return (
      <View style={styles.screen}>
        <BodyText>Loading…</BodyText>
      </View>
    );
  }

  function onSave() {
    save.mutate(
      { section: key, value: draft },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: SECTION_LABELS[key] }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {renderSection(key, draft, setDraft)}
        <BigButton
          label={save.isPending ? "Saving…" : "Save"}
          icon="checkmark"
          onPress={onSave}
          disabled={save.isPending}
          accessibilityLabel={`Save ${SECTION_LABELS[key]}`}
        />
      </ScrollView>
    </>
  );
}

function renderSection(
  key: SectionKey,
  draft: any,
  set: (v: any) => void,
) {
  const patch = (p: object) => set({ ...draft, ...p });

  switch (key) {
    case "identity":
      return (
        <>
          <BigField label="Your name" value={draft.legal_name ?? ""} onChangeText={(v) => patch({ legal_name: v })} />
          <BigField label="What should Rekalla call you?" hint="A nickname is fine" value={draft.preferred_name ?? ""} onChangeText={(v) => patch({ preferred_name: v })} />
          <BigField label="Your birthday" hint="For example: March 4, 1946" value={draft.birthday ?? ""} onChangeText={(v) => patch({ birthday: v })} />
          <BigField label="Where you're from" value={draft.hometown ?? ""} onChangeText={(v) => patch({ hometown: v })} />
          <BigField label="What you did for work" value={draft.career ?? ""} onChangeText={(v) => patch({ career: v })} />
          <BigField label="Religion or faith" hint="Only if you'd like to" value={draft.faith ?? ""} onChangeText={(v) => patch({ faith: v })} />
        </>
      );
    case "interests":
      return (
        <>
          <BodyText>Add a few, separated by commas.</BodyText>
          <BigField label="Hobbies" value={csv(draft.hobbies)} onChangeText={(v) => patch({ hobbies: toArr(v) })} />
          <BigField label="Music you love" value={csv(draft.music)} onChangeText={(v) => patch({ music: toArr(v) })} />
          <BigField label="Teams you follow" value={csv(draft.teams)} onChangeText={(v) => patch({ teams: toArr(v) })} />
          <BigField label="Shows you watch" value={csv(draft.shows)} onChangeText={(v) => patch({ shows: toArr(v) })} />
          <BigField label="Books you enjoy" value={csv(draft.books)} onChangeText={(v) => patch({ books: toArr(v) })} />
        </>
      );
    case "preferences":
      return (
        <>
          <Text style={styles.label}>How should Rekalla talk with you?</Text>
          <View style={styles.toggleRow}>
            {(["chatty", "brief"] as const).map((tone) => (
              <Pressable
                key={tone}
                accessibilityRole="radio"
                accessibilityState={{ selected: draft.tone === tone }}
                accessibilityLabel={tone === "chatty" ? "Chatty and friendly" : "Short and brief"}
                onPress={() => patch({ tone })}
                style={[styles.toggle, draft.tone === tone && styles.toggleOn]}
              >
                <Text style={[styles.toggleText, draft.tone === tone && { color: "#000" }]}>
                  {tone === "chatty" ? "Chatty" : "Brief"}
                </Text>
              </Pressable>
            ))}
          </View>
          <BigField label="Things you like to talk about" value={csv(draft.enjoy_topics)} onChangeText={(v) => patch({ enjoy_topics: toArr(v) })} />
          <BigField label="Anything you'd rather not discuss" hint="Rekalla will steer clear of these" value={csv(draft.avoid_topics)} onChangeText={(v) => patch({ avoid_topics: toArr(v) })} />
        </>
      );
    case "routine":
      return (
        <>
          <BigField
            label="What a normal week looks like"
            hint="One thing per line — like Church on Sunday"
            multiline
            value={(draft.typical_week ?? []).join("\n")}
            onChangeText={(v) => set({ ...draft, typical_week: v.split("\n").map((x: string) => x.trim()).filter(Boolean) })}
          />
          <BigField
            label="Regular plans"
            hint="One per line — like Bridge club Tuesdays or Sunday dinner with family"
            multiline
            value={(draft.standing_commitments ?? []).map((c: any) => c.label ?? "").join("\n")}
            onChangeText={(v) =>
              set({
                ...draft,
                standing_commitments: v.split("\n").map((x: string) => x.trim()).filter(Boolean).map((label: string) => ({ label })),
              })
            }
          />
        </>
      );
    case "people":
      return (
        <>
          <BodyText>
            Add your family, friends, and pets. Then you can ask things like
            "when's my son's birthday?" and Rekalla will know.
          </BodyText>
          <RepeatRows
            draft={draft}
            set={set}
            fields={[
              ["name", "Name"],
              ["relationship", "How you're related (son, friend, dog…)"],
              ["birthday", "Their birthday (optional)"],
              ["notes", "Anything to remember (optional)"],
            ]}
            addLabel="Add a person or pet"
          />
        </>
      );
    case "practical":
      return (
        <>
          <BodyText>
            A few details worth keeping handy — like your doctors, pharmacy, and
            who to call if something comes up.
          </BodyText>
          <RepeatList value={draft.doctors} onChange={(doctors) => set({ ...draft, doctors })} fields={[["name", "Doctor's name"], ["specialty", "What they help with"]]} addLabel="Add a doctor" />
          <BigField label="Your pharmacy" value={draft.pharmacy ?? ""} onChangeText={(v) => set({ ...draft, pharmacy: v })} />
          <Text style={styles.label}>Who to call in an emergency</Text>
          <RepeatList value={draft.emergency_contacts} onChange={(emergency_contacts) => set({ ...draft, emergency_contacts })} fields={[["name", "Name"], ["phone", "Phone"], ["relationship", "How you're related"]]} addLabel="Add someone to call" priority />
        </>
      );
    default:
      return <BodyText>Coming soon.</BodyText>;
  }
}

/** Repeatable name/relationship rows bound to the `people` array section. */
function RepeatRows({
  draft,
  set,
  fields,
  addLabel,
}: {
  draft: ProfilePerson[];
  set: (v: any) => void;
  fields: [string, string][];
  addLabel: string;
}) {
  const rows: any[] = Array.isArray(draft) ? draft : [];
  return <RepeatList value={rows} onChange={set} fields={fields} addLabel={addLabel} />;
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
  const update = (i: number, k: string, v: string) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [k]: v } : r));
    onChange(next);
  };
  return (
    <View style={{ gap: a11y.space(4) }}>
      {rows.map((row, i) => (
        <View key={i} style={styles.rowCard}>
          {priority ? <Text style={styles.priorityBadge}>#{i + 1}</Text> : null}
          {fields.map(([k, label]) => (
            <BigField key={k} label={label} value={row[k] ?? ""} onChangeText={(v) => update(i, priority && k === "phone" ? "phone" : k, v)} keyboardType={k === "phone" ? "phone-pad" : "default"} />
          ))}
          <BigButton label="Remove" icon="trash" variant="secondary" onPress={() => onChange(rows.filter((_, j) => j !== i))} accessibilityLabel={`Remove ${label(fields)} ${i + 1}`} />
        </View>
      ))}
      <BigButton
        label={addLabel}
        icon="add"
        variant="secondary"
        onPress={() => onChange([...rows, priority ? { priority: rows.length + 1 } : {}])}
        accessibilityLabel={addLabel}
      />
    </View>
  );
}

function label(fields: [string, string][]) {
  return fields[0]?.[1] ?? "item";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(12) },
  label: { color: colors.label, fontSize: a11yFont.body, fontWeight: "700" },
  toggleRow: { flexDirection: "row", gap: a11y.space(3) },
  toggle: {
    flex: 1,
    minHeight: 60,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: colors.label },
  toggleText: { color: colors.label, fontSize: a11yFont.button, fontWeight: "700" },
  rowCard: {
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: a11y.space(4),
    gap: a11y.space(3),
  },
  priorityBadge: { color: colors.blue, fontSize: a11yFont.body, fontWeight: "800" },
});
