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
  if (!iso) return "Not yet. It goes up when you finish your next practice.";
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
        "Rekalla does not have permission to send notifications yet. You can turn that on in the phone's Settings.",
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
        "Your Rekalla practice. Photographs are not in here, they are too large to send as text.",
      you: data.user,
      things: data.items,
      schedule: data.cards,
      daysPractised: data.progress.practiceDays,
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
        "That could not be finished just now. Nothing has been removed. Try again when you are back online.",
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
          Dark is where Rekalla starts. Some eyes read dark text on a light
          ground more easily, so light is here too, and both are held to the
          same contrast.
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
          You will feel a small tap when an answer is right. Nothing is ever
          felt when one is not.
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
          Rekalla also follows the text size set on the phone itself. This makes
          it larger again.
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
              <AppText color={colors.inkSoft}>{`Last copy kept: ${backupWhen(lastPushedAt)}`}</AppText>
            </View>
            <ChunkyButton
              label="Keep a copy now"
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
              Your practice is on this phone and nowhere else. An account keeps
              a copy of it, and nothing else.
            </Hint>
            <ChunkyButton label="Keep a copy for me" onPress={() => router.push("/join")} />
          </>
        )}
      </Section>

      <Section title="A copy for yourself">
        <Hint>
          Everything you have added, as text you can send to yourself or to
          somebody in the family. Photographs are not included.
        </Hint>
        <ChunkyButton
          label="Send me my data"
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
          {signedIn ? "Close my account" : "Start again"}
        </AppText>
        <Hint>
          {signedIn
            ? `This removes your account, the copy we keep, and everything on this phone. All ${items.length} of them.`
            : items.length === 1
              ? "This removes the one thing you have added, along with your practice."
              : `This removes all ${items.length} things you have added, along with your practice.`}
        </Hint>

        {confirming ? (
          <View style={{ gap: space(6) }}>
            <AppText weight="bold" accessibilityLiveRegion="polite">
              Remove everything and start again? This cannot be undone.
            </AppText>
            <ChunkyButton label="No, keep everything" onPress={() => setConfirming(false)} />
            <View style={{ paddingTop: space(6) }}>
              <ChunkyButton
                label={busy ? "One moment" : "Yes, remove everything"}
                tone="secondary"
                disabled={busy}
                onPress={() => void removeEverything()}
              />
            </View>
          </View>
        ) : (
          <ChunkyButton
            label={signedIn ? "Close my account" : "Start again"}
            tone="secondary"
            hint="Asks you to confirm first"
            onPress={() => setConfirming(true)}
          />
        )}
      </View>
    </Screen>
  );
}
