import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n";
import { colors, font, spacing } from "../../lib/theme";
import { isInternalAuthError } from "../../lib/utils";
import { Screen, Card, Button, Field, Title, Subtitle } from "../../components/ui";
import type { AccountType } from "../../lib/types";

const RESEND_COOLDOWN = 60;

// Supabase's "Email OTP Length" is configurable per project (6–10). Don't
// assume a length here — accept anything in that range and let the server
// decide whether the code is right.
const MIN_CODE = 6;
const MAX_CODE = 10;

/**
 * Email verification by emailed code.
 *
 * Reached from sign-up when Supabase returns no session, which happens when
 * "Confirm email" is on (mailer_autoconfirm off). When autoconfirm is on the
 * user never lands here — sign-up gets a session and goes straight to the app.
 */
export default function Verify() {
  const t = useT();
  const params = useLocalSearchParams<{
    email?: string;
    accountType?: string;
    selfManaged?: string;
  }>();

  const email = (params.email ?? "").trim();
  // Only present when we came from sign-up. Arriving from sign-in (an account
  // that was never verified) carries no choices to re-assert, and must not
  // guess — defaulting would overwrite a caregiver's profile to "patient".
  const signUpChoice: { accountType: AccountType; selfManaged: boolean } | null =
    params.accountType === "caregiver"
      ? { accountType: "caregiver", selfManaged: false }
      : params.accountType === "patient"
        ? { accountType: "patient", selfManaged: params.selfManaged === "1" }
        : null;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  // Countdown so people can't hammer the resend button into a rate limit.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timer.current = setInterval(() => {
      setCooldown((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function handleVerify() {
    setError(null);
    setNotice(null);

    const token = code.replace(/\D/g, "");
    if (token.length < MIN_CODE || token.length > MAX_CODE) {
      return setError(t("auth.verify.err.code"));
    }

    setBusy(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (verifyError || !data.session) {
      setBusy(false);
      return setError(t("auth.verify.err.invalid"));
    }

    // Coming from sign-up: the handle_new_user trigger already wrote these
    // from the sign-up metadata; re-assert them now that we have a session,
    // exactly as the sign-up path does.
    let accountType: AccountType = "patient";
    if (signUpChoice && data.user) {
      accountType = signUpChoice.accountType;
      await supabase
        .from("profiles")
        .update({
          account_type: accountType,
          self_managed:
            accountType === "patient" ? signUpChoice.selfManaged : false,
        })
        .eq("id", data.user.id);
    } else if (data.user) {
      // Coming from sign-in: read what the account already is, change nothing.
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single();
      if (profile?.account_type === "caregiver") accountType = "caregiver";
    }

    router.replace(
      accountType === "caregiver" ? "/(caregiver)/people" : "/(patient)/summary",
    );
  }

  async function handleResend() {
    if (cooldown > 0 || busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setBusy(false);
    if (resendError)
      return setError(
        isInternalAuthError(resendError)
          ? t("auth.err.unexpected")
          : resendError.message,
      );
    setNotice(t("auth.verify.resent"));
    setCooldown(RESEND_COOLDOWN);
  }

  return (
    <Screen>
      <View style={styles.logoWrap}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logo}
          accessibilityLabel="Rekalla"
        />
        <Text style={styles.wordmark}>{t("auth.wordmark")}</Text>
      </View>

      <Card>
        <Title>{t("auth.verify.title")}</Title>
        <Subtitle>{t("auth.verify.subtitle", { email })}</Subtitle>

        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}

        <Field
          label={t("auth.verify.code")}
          value={code}
          onChangeText={(next) => setCode(next.replace(/\D/g, "").slice(0, MAX_CODE))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={MAX_CODE}
          placeholder={t("auth.verify.codePlaceholder")}
          style={styles.codeInput}
        />

        <Button
          label={t("auth.verify.button")}
          loading={busy}
          onPress={handleVerify}
        />

        <Text style={styles.junkHint}>{t("auth.verify.junkHint")}</Text>

        <Button
          label={
            cooldown > 0
              ? t("auth.verify.resendIn", { seconds: cooldown })
              : t("auth.verify.resend")
          }
          variant="ghost"
          disabled={cooldown > 0 || busy}
          onPress={handleResend}
        />

        <Pressable
          accessibilityRole="link"
          style={styles.backLink}
          onPress={() => router.replace("/(auth)/sign-up")}
        >
          <Text style={styles.backText}>{t("auth.verify.backToSignUp")}</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: "center", gap: spacing(3), marginVertical: spacing(4) },
  logo: { width: 84, height: 84, borderRadius: 20 },
  wordmark: { color: colors.label, fontSize: font.x2, fontWeight: "700" },
  error: { color: colors.red, fontSize: font.base, fontWeight: "600" },
  notice: { color: colors.green, fontSize: font.base, fontWeight: "600" },
  // Only the overrides — `Field` merges these over its base input style, which
  // is what supplies the white text, background, height and padding.
  codeInput: { fontSize: font.x2, letterSpacing: 6, textAlign: "center" },
  junkHint: {
    color: colors.label3,
    fontSize: font.sm,
    lineHeight: 21,
    textAlign: "center",
  },
  backLink: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.label3, fontSize: font.base },
});
