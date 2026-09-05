/**
 * One optional reminder, at a time of their choosing.
 *
 * Whole times rather than a spinner, and "no reminder" is a first-class
 * answer sitting alongside the others rather than a way of refusing.
 */
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { AppText, Hint } from "../../components/practice/text";
import { usePractice } from "../../lib/practice/context";
import { REMINDER_CHOICES, setDailyReminder } from "../../lib/practice/reminders";
import { space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

export default function Reminder() {
  const colors = useTheme();
  const { updateUser } = usePractice();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(time: string | null) {
    if (busy) return;
    setBusy(true);
    const scheduled = await setDailyReminder(time);
    if (!scheduled) {
      await updateUser({ reminderTime: null });
      setNote(
        "Rekalla can't send notifications yet. Turn that on in your phone's Settings, then pick a time again here.",
      );
      setBusy(false);
      return;
    }
    await updateUser({ reminderTime: time });
    router.replace("/join");
  }

  return (
    <Screen title="Want a daily reminder?" onBack={() => router.back()}>
      <Hint>
        One a day, at a time you pick. Change it or turn it off anytime.
      </Hint>

      <View style={{ gap: space(4), paddingTop: space(2) }}>
        {REMINDER_CHOICES.map((choice) => (
          <ChunkyButton
            key={choice.value}
            label={choice.label}
            tone="secondary"
            disabled={busy}
            onPress={() => void choose(choice.value)}
          />
        ))}
        <ChunkyButton
          label="No reminder"
          tone="secondary"
          disabled={busy}
          onPress={() => void choose(null)}
        />
      </View>

      {note ? (
        <AppText color={colors.inkSoft} accessibilityLiveRegion="polite">
          {note}
        </AppText>
      ) : null}
    </Screen>
  );
}
