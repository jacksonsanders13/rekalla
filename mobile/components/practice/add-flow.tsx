/**
 * Adding something, one question to a screen.
 *
 * The same flow is used when setting up and when adding later, so there is
 * only one way to put something in and only one thing to learn. Each screen
 * asks one question, in words, and has one obvious way onward. Anything that
 * can be left out says so.
 */
import { useState } from "react";
import { Image, TextInput, View } from "react-native";
import { Screen } from "./screen";
import { ChunkyButton } from "./chunky-button";
import { ProgressDots } from "./progress-dots";
import { RekallaSays } from "./rekalla-says";
import { AppText, Hint } from "./text";
import {
  TAP_MIN,
  colors,
  fonts,
  lineHeightFor,
  radius,
  space,
  type as typeScale,
} from "../../lib/design/tokens";
import { useTextScale } from "../../lib/design/text-scale";
import { pickFacePhoto, toDataUri } from "../../lib/practice/photos";
import type { CategoryTemplate } from "../../lib/practice/templates";

interface AddFlowProps {
  template: CategoryTemplate;
  onDone: (
    values: Record<string, string>,
    photoBase64: string | null,
  ) => void | Promise<void>;
  /** Back from the first question. */
  onCancel: () => void;
  finishLabel?: string;
}

export function AddFlow({
  template,
  onDone,
  onCancel,
  finishLabel = "Save",
}: AddFlowProps) {
  const scale = useTextScale();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const field = template.fields[step];
  const isLast = step === template.fields.length - 1;
  const value = values[field.key] ?? "";
  const filled = field.kind === "photo" ? photoBase64 !== null : value.trim().length > 0;

  async function finish() {
    if (saving) return;
    setSaving(true);
    try {
      await onDone(values, photoBase64);
    } finally {
      setSaving(false);
    }
  }

  function forward() {
    if (isLast) {
      void finish();
      return;
    }
    setStep(step + 1);
  }

  function back() {
    if (step === 0) {
      onCancel();
      return;
    }
    setStep(step - 1);
  }

  async function choosePhoto(source: "camera" | "library") {
    const outcome = await pickFacePhoto(source);
    if (outcome.status === "picked") {
      setPhotoBase64(outcome.base64);
      setPhotoNote(null);
      return;
    }
    if (outcome.status === "blocked") {
      setPhotoNote(
        source === "camera"
          ? "Rekalla does not have permission to use the camera yet. You can turn that on in the phone's Settings, or carry on without a photo."
          : "Rekalla does not have permission to see your photos yet. You can turn that on in the phone's Settings, or carry on without a photo.",
      );
    }
  }

  return (
    <Screen
      title={field.question}
      onBack={back}
      footer={
        <>
          <ChunkyButton
            label={isLast ? finishLabel : "Continue"}
            onPress={forward}
            disabled={!filled || saving}
            hint={
              filled
                ? undefined
                : "Fill this in first, or leave it out if it says you can"
            }
          />
          {field.optional ? (
            <ChunkyButton
              label={isLast ? `${finishLabel} without this` : "Leave this out"}
              tone="secondary"
              onPress={forward}
              disabled={saving}
            />
          ) : null}
        </>
      }
    >
      <ProgressDots total={template.fields.length} done={step} />

      <RekallaSays>{field.explain}</RekallaSays>

      {field.hint ? <Hint>{field.hint}</Hint> : null}

      {field.kind === "photo" ? (
        <View style={{ gap: space(5) }}>
          {photoBase64 ? (
            <View style={{ alignItems: "center", gap: space(4) }}>
              <Image
                source={{ uri: toDataUri(photoBase64) }}
                accessibilityLabel="The photo you chose"
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: radius.photo,
                  backgroundColor: colors.card,
                }}
              />
              <ChunkyButton
                label="Choose a different photo"
                tone="secondary"
                onPress={() => choosePhoto("library")}
              />
            </View>
          ) : (
            <View style={{ gap: space(4) }}>
              <ChunkyButton
                label="Take a photo"
                tone="secondary"
                onPress={() => choosePhoto("camera")}
              />
              <ChunkyButton
                label="Choose from my photos"
                tone="secondary"
                onPress={() => choosePhoto("library")}
              />
            </View>
          )}
          {photoNote ? <Hint>{photoNote}</Hint> : null}
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={(next) => setValues({ ...values, [field.key]: next })}
          placeholder={field.placeholder}
          placeholderTextColor={colors.inkSoft}
          accessibilityLabel={field.question}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (filled) forward();
          }}
          multiline={field.key === "detail"}
          style={{
            minHeight: TAP_MIN + space(2),
            borderWidth: 2,
            borderColor: colors.line,
            borderRadius: radius.button,
            backgroundColor: colors.card,
            paddingHorizontal: space(4),
            paddingVertical: space(3),
            fontFamily: fonts.semibold,
            fontSize: Math.round(typeScale.bodyLarge * scale),
            lineHeight: lineHeightFor(Math.round(typeScale.bodyLarge * scale)),
            color: colors.ink,
          }}
        />
      )}

      {field.optional ? (
        <AppText size="body" color={colors.inkSoft}>
          You can add this later if you would rather.
        </AppText>
      ) : null}
    </Screen>
  );
}
