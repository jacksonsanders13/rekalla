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
        footer={<ChunkyButton label="Carry on" onPress={() => router.replace("/home")} />}
      >
        <RekallaSays avatarSize={84}>
          <View style={{ gap: space(3) }}>
            <AppText size="body">
              {`Your account is made. There is an email on its way to ${email.trim()}, with a link in it to confirm the address.`}
            </AppText>
            <AppText size="body">
              Nothing is waiting on that. Carry on practising, and once you have
              tapped the link, sign in from Settings and I will start keeping a
              copy.
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
          label={busy ? "One moment" : "Create my account"}
          disabled={!canSubmit}
          hint={
            canSubmit
              ? "Makes the account and keeps a copy of your practice"
              : "Fill in an email address and a password of at least eight characters"
          }
          onPress={() => void create()}
        />
      }
    >
      <Hint>
        Only used to keep your practice safe, and to let you back in. Nothing is
        sent to you except the odd thing about your own account.
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
            ? "That is long enough."
            : `${MIN_PASSWORD_LENGTH} characters or more. It is shown as you type, so you can check it.`
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
