/**
 * Settings.
 *
 * Text size, the reminder, the account, a copy of your own data, and the one
 * way to remove everything. Every choice is a large labelled button rather
 * than a switch, because a switch tells you its state only by which end the
 * knob is at.
 *
 * There is exactly one destructive control on this screen and it is at the
 * bottom, behind a confirmation, well clear of anything else. Closing an
 * account and wiping the phone are the same action here on purpose: two
 * separate ways to lose everything, sitting near each other, is how somebody
 * taps the wrong one.
 */
import { useState, type ReactNode } from "react";
import { Share, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/practice/screen";
import { ChunkyButton } from "../components/practice/chunky-button";
import { AppText, Hint } from "../components/practice/text";
import { useAuth } from "../lib/practice/auth";
import { usePractice } from "../lib/practice/context";
import { TEXT_SCALE_CHOICES } from "../lib/design/text-scale";
import { THEME_CHOICES } from "../lib/design/theme";
import { REMINDER_CHOICES, setDailyReminder } from "../lib/practice/reminders";
import { radius, space } from "../lib/design/tokens";
import { useTheme } from "../lib/design/theme";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: space(4), paddingTop: space(4) }}>
      <AppText size="bodyLarge" weight="bold">
        {title}
      </AppText>
      {children}
    </View>
  );
}

/** "Today at 14:20", or "not yet". */
function backupWhen(iso: string | null): string {
  if (!iso) return "Not yet. Happens after your next session.";
  const when = new Date(iso);
  const today = new Date();
  const sameDay =
    when.getFullYear() === today.getFullYear() &&
    when.getMonth() === today.getMonth() &&
    when.getDate() === today.getDate();
  const time = `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
  return sameDay ? `Today at ${time}` : `${when.toDateString()} at ${time}`;
}

export default function Preferences() {
  const colors = useTheme();
  const {
    user,
    items,
    data,
    updateUser,
    clearEverything,
    backedUpTo,
    lastPushedAt,
    backUpQuietly,
    closeAccount,
  } = usePractice();
  const { email, userId, signOut } = useAuth();

  const [note, setNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const signedIn = Boolean(userId) && backedUpTo === userId;

  async function chooseReminder(time: string | null) {
    const scheduled = await setDailyReminder(time);
    if (!scheduled) {
      await updateUser({ reminderTime: null });
      setNote(
        "Rekalla can't send notifications yet. Turn that on in your phone's Settings.",
      );
      return;
    }
    setNote(null);
    await updateUser({ reminderTime: time });
  }

  async function exportEverything() {
    const bundle = {
      exportedAt: new Date().toISOString(),
      about:
        "Your Rekalla practice. Photos are not included, they are too large to send as text.",
      you: data.user,
      things: data.items,
      schedule: data.cards,
      daysPracticed: data.progress.practiceDays,
    };
    await Share.share({
      title: "My Rekalla practice",
      message: JSON.stringify(bundle, null, 2),
    });
  }

  async function removeEverything() {
    if (busy) return;
    setBusy(true);
    try {
      await setDailyReminder(null);
      if (signedIn && userId) {
        await closeAccount(userId);
        await signOut();
      } else {
        await clearEverything();
      }
      router.replace("/welcome");
    } catch {
      setNote(
        "That didn't finish. Nothing was deleted. Try again when you're back online.",
      );
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <Screen title="Settings" onBack={() => router.back()}>
      <Section title="How it looks">
        {THEME_CHOICES.map((choice) => (
          <ChunkyButton
            key={choice.name}
            label={choice.label}
            tone={user?.theme === choice.name ? "primary" : "secondary"}
            selected={user?.theme === choice.name}
            hint={choice.hint}
            onPress={() => void updateUser({ theme: choice.name })}
          />
        ))}
        <Hint>
          Dark by default. Light is easier on some eyes. Both are high
          contrast.
        </Hint>
      </Section>

      <Section title="The tap you feel">
        <ChunkyButton
          label="On"
          tone={user?.hapticsOn !== false ? "primary" : "secondary"}
          selected={user?.hapticsOn !== false}
          hint="A small tap when you get one right"
          onPress={() => void updateUser({ hapticsOn: true })}
        />
        <ChunkyButton
          label="Off"
          tone={user?.hapticsOn === false ? "primary" : "secondary"}
          selected={user?.hapticsOn === false}
          onPress={() => void updateUser({ hapticsOn: false })}
        />
        <Hint>
          A small tap when you get one right. Nothing when you don't.
        </Hint>
      </Section>

      <Section title="Text size">
        {TEXT_SCALE_CHOICES.map((choice) => (
          <ChunkyButton
            key={choice.label}
            label={choice.label}
            tone={user?.textScale === choice.value ? "primary" : "secondary"}
            selected={user?.textScale === choice.value}
            onPress={() => void updateUser({ textScale: choice.value })}
          />
        ))}
        <Hint>
          Rekalla follows your phone's text size. This makes it bigger still.
        </Hint>
      </Section>

      <Section title="Daily reminder">
        {REMINDER_CHOICES.map((choice) => (
          <ChunkyButton
            key={choice.value}
            label={choice.label}
            tone={user?.reminderTime === choice.value ? "primary" : "secondary"}
            selected={user?.reminderTime === choice.value}
            onPress={() => void chooseReminder(choice.value)}
          />
        ))}
        <ChunkyButton
          label="No reminder"
          tone={user?.reminderTime ? "secondary" : "primary"}
          selected={!user?.reminderTime}
          onPress={() => void chooseReminder(null)}
        />
      </Section>

      <Section title="Your account">
        {signedIn ? (
          <>
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 2,
                borderColor: colors.line,
                borderRadius: radius.card,
                padding: space(5),
                gap: space(2),
              }}
            >
              <AppText weight="bold">{email ?? "Signed in"}</AppText>
              <AppText color={colors.inkSoft}>{`Last backup: ${backupWhen(lastPushedAt)}`}</AppText>
            </View>
            <ChunkyButton
              label="Back up now"
              tone="secondary"
              onPress={() => void backUpQuietly()}
            />
            <ChunkyButton
              label="Sign out"
              tone="secondary"
              hint="Your practice stays on this phone"
              onPress={() => void signOut()}
            />
          </>
        ) : (
          <>
            <Hint>
              Your practice is on this phone only. An account keeps a backup.
              That's all it does.
            </Hint>
            <ChunkyButton label="Create an account" onPress={() => router.push("/join")} />
          </>
        )}
      </Section>

      <Section title="Export your data">
        <Hint>
          Everything you've added, as text you can send to yourself. Photos
          are not included.
        </Hint>
        <ChunkyButton
          label="Export"
          tone="secondary"
          onPress={() => void exportEverything()}
        />
      </Section>

      {note ? (
        <AppText color={colors.inkSoft} accessibilityLiveRegion="polite">
          {note}
        </AppText>
      ) : null}

      <View style={{ gap: space(4), paddingTop: space(12) }}>
        <AppText size="bodyLarge" weight="bold">
          {signedIn ? "Close my account" : "Start over"}
        </AppText>
        <Hint>
          {signedIn
            ? `Deletes your account, the backup, and everything on this phone. All ${items.length} of them.`
            : items.length === 1
              ? "Deletes the one thing you've added, and your practice history."
              : `Deletes all ${items.length} things you've added, and your practice history.`}
        </Hint>

        {confirming ? (
          <View style={{ gap: space(6) }}>
            <AppText weight="bold" accessibilityLiveRegion="polite">
              Delete everything and start over? This can't be undone.
            </AppText>
            <ChunkyButton label="Cancel" onPress={() => setConfirming(false)} />
            <View style={{ paddingTop: space(6) }}>
              <ChunkyButton
                label={busy ? "Working" : "Delete everything"}
                tone="secondary"
                disabled={busy}
                onPress={() => void removeEverything()}
              />
            </View>
          </View>
        ) : (
          <ChunkyButton
            label={signedIn ? "Close my account" : "Start over"}
            tone="secondary"
            hint="Asks you to confirm first"
            onPress={() => setConfirming(true)}
          />
        )}
      </View>
    </Screen>
  );
}
