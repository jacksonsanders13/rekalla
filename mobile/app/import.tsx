/**
 * Bringing people in from the address book.
 *
 * Three steps, and the middle one is the point: read the contacts, tick the
 * people worth remembering, and then answer one question for anyone whose
 * name did not already say what they are to you. Somebody saved as
 * "Grandma Jean" needs no question. Somebody saved as "Jane Smith" does.
 *
 * Nothing leaves the phone and nothing is kept unless it is ticked.
 */
import { useState } from "react";
import { Image, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/practice/screen";
import { ChunkyButton } from "../components/practice/chunky-button";
import { ChoiceRow } from "../components/practice/choice-row";
import { RekallaSays } from "../components/practice/rekalla-says";
import { AppText, Hint } from "../components/practice/text";
import { useTheme } from "../lib/design/theme";
import { useTextScale } from "../lib/design/text-scale";
import { usePractice } from "../lib/practice/context";
import {
  encodeContactPhoto,
  loadImportableContacts,
  type ImportableContact,
} from "../lib/practice/contacts";
import {
  TAP_MIN,
  fonts,
  lineHeightFor,
  radius,
  space,
  type as typeScale,
} from "../lib/design/tokens";

/** The ones an older adult is most likely to be adding, in that order. */
const COMMON = [
  "Granddaughter", "Grandson", "Daughter", "Son",
  "Sister", "Brother", "Wife", "Husband",
  "Friend", "Neighbor",
];

/** Enough of a list to scan; search narrows it past that. */
const SHOWN_AT_ONCE = 50;

type Phase = "intro" | "blocked" | "picking" | "labeling" | "saving";

export default function Import() {
  const colors = useTheme();
  const scale = useTextScale();
  const { addItem } = usePractice();

  const [phase, setPhase] = useState<Phase>("intro");
  const [all, setAll] = useState<ImportableContact[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // The people still to be asked about, and what has been answered.
  const [toLabel, setToLabel] = useState<ImportableContact[]>([]);
  const [labelIndex, setLabelIndex] = useState(0);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [typed, setTyped] = useState("");
  const [saved, setSaved] = useState(0);

  async function begin() {
    const outcome = await loadImportableContacts();
    if (outcome.status === "blocked") {
      setPhase("blocked");
      return;
    }
    setAll(outcome.contacts);
    setPhase("picking");
  }

  function toggle(id: string) {
    setPicked((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );
  }

  function onward() {
    const chosen = all.filter((contact) => picked.includes(contact.id));
    const unlabeled = chosen.filter((contact) => !contact.relationship);
    if (unlabeled.length === 0) {
      void save(chosen, {});
      return;
    }
    setToLabel(unlabeled);
    setLabelIndex(0);
    setPhase("labeling");
  }

  function answer(contact: ImportableContact, relationship: string | null) {
    const next = relationship ? { ...labels, [contact.id]: relationship } : labels;
    setLabels(next);
    setTyped("");

    if (labelIndex + 1 < toLabel.length) {
      setLabelIndex(labelIndex + 1);
      return;
    }
    void save(all.filter((c) => picked.includes(c.id)), next);
  }

  async function save(
    chosen: ImportableContact[],
    answered: Record<string, string>,
  ) {
    setPhase("saving");
    let count = 0;

    for (const contact of chosen) {
      const relationship = contact.relationship ?? answered[contact.id] ?? "";
      const photoBase64 = contact.photoUri
        ? await encodeContactPhoto(contact.photoUri)
        : null;

      await addItem({
        category: "person",
        values: { name: contact.name, relationship },
        photoBase64,
      });
      count += 1;
      setSaved(count);
    }

    router.replace("/tree");
  }

  // ---------------------------------------------------------------- intro
  if (phase === "intro") {
    return (
      <Screen
        title="Add from your contacts"
        onBack={() => router.back()}
        footer={
          <ChunkyButton
            label="Choose from contacts"
            hint="Asks for permission to read your contacts"
            onPress={() => void begin()}
          />
        }
      >
        <RekallaSays avatarSize={76}>
          Your phone already knows most of these people. Pick the ones you want
          to remember and I'll take their name and photo.
        </RekallaSays>
        <Hint>
          Nothing leaves your phone, and nothing is saved unless you tick it.
        </Hint>
      </Screen>
    );
  }

  // -------------------------------------------------------------- blocked
  if (phase === "blocked") {
    return (
      <Screen
        title="Rekalla can't see your contacts"
        onBack={() => router.back()}
        footer={
          <ChunkyButton label="Add someone by hand" onPress={() => router.replace("/add?category=person")} />
        }
      >
        <AppText color={colors.inkSoft}>
          Turn contacts on for Rekalla in your phone's Settings, then come back.
          Or add someone by hand, which works just as well.
        </AppText>
      </Screen>
    );
  }

  // --------------------------------------------------------------- saving
  if (phase === "saving") {
    return (
      <Screen title="Saving">
        <RekallaSays avatarSize={76}>
          {`Adding ${picked.length === 1 ? "1 person" : `${picked.length} people`} to your tree.`}
        </RekallaSays>
        <AppText size="bodyLarge" center>
          {`${saved} of ${picked.length}`}
        </AppText>
      </Screen>
    );
  }

  // ------------------------------------------------------------- labeling
  if (phase === "labeling") {
    const contact = toLabel[labelIndex];
    return (
      <Screen
        title={`Who is ${contact.name} to you?`}
        onBack={() => setPhase("picking")}
        progress={(labelIndex + 1) / toLabel.length}
        footer={
          <>
            <ChunkyButton
              label="Save this"
              disabled={typed.trim().length === 0}
              onPress={() => answer(contact, typed.trim())}
            />
            <ChunkyButton
              label="Skip"
              tone="secondary"
              hint="Adds them without saying where they go on the tree"
              onPress={() => answer(contact, null)}
            />
          </>
        }
      >
        <Hint>
          {`Their name didn't say. This is how I'll ask about them, and where they go on your tree.`}
        </Hint>

        <View style={{ gap: space(3) }}>
          {COMMON.map((word) => (
            <ChoiceRow
              key={word}
              label={word}
              onPress={() => answer(contact, word)}
            />
          ))}
        </View>

        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder="Or type it: cousin, godmother…"
          placeholderTextColor={colors.inkSoft}
          accessibilityLabel={`Who is ${contact.name} to you?`}
          style={{
            minHeight: TAP_MIN + space(2),
            borderWidth: 2,
            borderColor: colors.line,
            borderRadius: radius.button,
            backgroundColor: colors.card,
            paddingHorizontal: space(4),
            fontFamily: fonts.semibold,
            fontSize: Math.round(typeScale.bodyLarge * scale),
            lineHeight: lineHeightFor(Math.round(typeScale.bodyLarge * scale)),
            color: colors.ink,
          }}
        />
      </Screen>
    );
  }

  // -------------------------------------------------------------- picking
  const needle = search.trim().toLowerCase();
  const matching = needle
    ? all.filter((c) => c.rawName.toLowerCase().includes(needle))
    : all;
  const shown = matching.slice(0, SHOWN_AT_ONCE);

  return (
    <Screen
      title="Who do you want to remember?"
      onBack={() => router.back()}
      footer={
        <ChunkyButton
          label={
            picked.length === 0
              ? "Pick someone"
              : picked.length === 1
                ? "Add 1 person"
                : `Add ${picked.length} people`
          }
          disabled={picked.length === 0}
          onPress={onward}
        />
      }
    >
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search your contacts"
        placeholderTextColor={colors.inkSoft}
        accessibilityLabel="Search your contacts"
        style={{
          minHeight: TAP_MIN,
          borderWidth: 2,
          borderColor: colors.line,
          borderRadius: radius.button,
          backgroundColor: colors.card,
          paddingHorizontal: space(4),
          fontFamily: fonts.semibold,
          fontSize: Math.round(typeScale.bodyLarge * scale),
          color: colors.ink,
        }}
      />

      <Hint>
        {matching.length > shown.length
          ? `Showing ${shown.length} of ${matching.length}. Search to narrow it down.`
          : "People whose name says what they are to you come first."}
      </Hint>

      <View style={{ gap: space(3) }}>
        {shown.map((contact) => (
          <ChoiceRow
            key={contact.id}
            label={contact.rawName}
            sublabel={contact.relationship ? `Your ${contact.relationship}` : null}
            selected={picked.includes(contact.id)}
            onPress={() => toggle(contact.id)}
            glyph={
              contact.photoUri ? (
                <Image
                  source={{ uri: contact.photoUri }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : undefined
            }
          />
        ))}
      </View>
    </Screen>
  );
}
