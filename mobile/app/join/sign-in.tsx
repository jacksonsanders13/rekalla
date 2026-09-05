/**
 * Signing back in.
 *
 * The screen where somebody arrives on a replaced phone, so the wording after
 * it matters: they need to be told plainly whether their people came back.
 * If the account holds practice, it comes down and takes over. If it does
 * not, whatever is on this phone goes up.
 */
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { Field } from "../../components/practice/field";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { AppText, Hint } from "../../components/practice/text";
import { useAuth } from "../../lib/practice/auth";
import { usePractice } from "../../lib/practice/context";
import { radius, space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

export default function SignIn() {
  const colors = useTheme();
  const { signIn } = useAuth();
  const { linkAccount } = usePractice();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const canSubmit = email.includes("@") && password.length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setProblem(null);

    const attempt = await signIn(email, password);
    if (!attempt.ok || !attempt.userId) {
      setProblem(attempt.message ?? "That did not work. Your practice is safe on this phone.");
      setBusy(false);
      return;
    }

    try {
      const direction = await linkAccount(attempt.userId);
      if (direction === "pulled") {
        setRestored(true);
        setBusy(false);
        return;
      }
    } catch {
      // Signed in either way. The copy goes up on its own later.
    }
    router.replace("/home");
  }

  if (restored) {
    return (
      <Screen
        title="Everything is back"
        footer={<ChunkyButton label="Continue" onPress={() => router.replace("/home")} />}
      >
        <RekallaSays avatarSize={84}>
          Your people are back, with their schedules. Pick up where you left off.
        </RekallaSays>
      </Screen>
    );
  }

  return (
    <Screen
      title="Sign in"
      onBack={() => router.back()}
      footer={
        <ChunkyButton
          label={busy ? "Working" : "Sign in"}
          disabled={!canSubmit}
          onPress={() => void submit()}
        />
      }
    >
      <Hint>The email and password you signed up with.</Hint>

      <Field
        label="Your email address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Field
        label="Your password"
        value={password}
        onChangeText={setPassword}
        secure
        autoComplete="password"
        hint="Shown as you type so you can check it."
        onSubmitEditing={() => void submit()}
      />

      {problem ? (
        <View
          style={{
            backgroundColor: colors.reveal,
            borderColor: colors.revealEdge,
            borderWidth: 2,
            borderRadius: radius.card,
            padding: space(5),
          }}
        >
          <AppText color={colors.revealInk} accessibilityLiveRegion="polite">
            {problem}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}
