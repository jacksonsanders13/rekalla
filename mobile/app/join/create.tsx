/**
 * Making an account.
 *
 * Two fields, both large, the password readable by default, and the rule
 * about its length said before it is typed rather than thrown back
 * afterwards. No puzzle to prove anybody is a person, and no wall waiting on
 * an email: if confirmation is switched on, the account is made, the app
 * carries on exactly as it was, and the copy starts going up when they
 * confirm and sign in.
 */
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { Field } from "../../components/practice/field";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { AppText, Hint } from "../../components/practice/text";
import { MIN_PASSWORD_LENGTH, useAuth } from "../../lib/practice/auth";
import { usePractice } from "../../lib/practice/context";
import { radius, space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

export default function Create() {
  const colors = useTheme();
  const { signUp } = useAuth();
  const { linkAccount } = usePractice();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  const longEnough = password.length >= MIN_PASSWORD_LENGTH;
  const looksLikeEmail = email.includes("@") && email.trim().length > 3;
  const canSubmit = longEnough && looksLikeEmail && !busy;

  async function create() {
    if (!canSubmit) return;
    setBusy(true);
    setProblem(null);

    const attempt = await signUp(email, password);

    if (!attempt.ok) {
      setProblem(attempt.message ?? "That did not work. Your practice is safe on this phone.");
      setBusy(false);
      return;
    }

    if (attempt.awaitingEmail) {
      setAwaitingEmail(true);
      setBusy(false);
      return;
    }

    if (attempt.userId) {
      try {
        await linkAccount(attempt.userId);
      } catch {
        // The account exists and the phone still has everything on it. The
        // copy goes up on its own after the next session.
      }
    }
    router.replace("/home");
  }

  if (awaitingEmail) {
    return (
      <Screen
        title="Nearly there"
        footer={<ChunkyButton label="Continue" onPress={() => router.replace("/home")} />}
      >
        <RekallaSays avatarSize={84}>
          <View style={{ gap: space(3) }}>
            <AppText size="body">
              {`Account created. Check ${email.trim()} for a link to confirm the address.`}
            </AppText>
            <AppText size="body">
              You don't have to wait. Keep practicing. Once you've tapped the
              link, sign in from Settings and backups start.
            </AppText>
          </View>
        </RekallaSays>
      </Screen>
    );
  }

  return (
    <Screen
      title="Make an account"
      onBack={() => router.back()}
      footer={
        <ChunkyButton
          label={busy ? "Working" : "Create account"}
          disabled={!canSubmit}
          hint={
            canSubmit
              ? "Creates the account and backs up your practice"
              : "Enter an email and a password of at least 8 characters"
          }
          onPress={() => void create()}
        />
      }
    >
      <Hint>
        Used to back up your practice and let you sign back in. Nothing else.
      </Hint>

      <Field
        label="Your email address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Field
        label="A password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least eight characters"
        secure
        autoComplete="new-password"
        hint={
          longEnough
            ? "Long enough."
            : `${MIN_PASSWORD_LENGTH} characters or more. Shown as you type so you can check it.`
        }
        onSubmitEditing={() => void create()}
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
