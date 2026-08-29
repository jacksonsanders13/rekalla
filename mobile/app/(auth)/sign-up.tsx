import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n";
import { colors, font, spacing, fonts } from "../../lib/theme";
import { isInternalAuthError } from "../../lib/utils";
import { Screen, Card, Button, Field, Title, Subtitle } from "../../components/ui";

// v2 is a single-user product for the older adult — no account-type choice.
export default function SignUp() {
  const t = useT();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (fullName.trim().length < 2) return setError(t("auth.err.name"));
    if (!email.includes("@")) return setError(t("auth.err.email"));
    if (password.length < 8) return setError(t("auth.err.password"));

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), account_type: "patient", self_managed: true },
      },
    });

    if (signUpError) {
      setBusy(false);
      return setError(
        isInternalAuthError(signUpError) ? t("auth.err.unexpected") : signUpError.message,
      );
    }

    // No session means "Confirm email" is on. Send them to the code screen.
    if (!data.session) {
      setBusy(false);
      return router.push({
        pathname: "/(auth)/verify",
        params: { email: email.trim() },
      });
    }

    if (data.user) {
      await supabase
        .from("profiles")
        .update({ account_type: "patient", self_managed: true })
        .eq("id", data.user.id);
    }

    // Into the chat — Rekalla runs the first-time setup there.
    router.replace("/(patient)/home");
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
        <Title>{t("auth.signUp.title")}</Title>
        <Subtitle>{t("auth.signUp.subtitle")}</Subtitle>

        {error && <Text style={styles.error}>{error}</Text>}

        <Field
          label={t("auth.field.name")}
          value={fullName}
          onChangeText={setFullName}
          autoComplete="name"
          placeholder={t("auth.field.namePlaceholder")}
        />
        <Field
          label={t("auth.field.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder={t("auth.field.emailPlaceholder")}
        />
        <Field
          label={t("auth.field.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder={t("auth.field.passwordPlaceholder")}
        />

        <Button label={t("auth.signUp.button")} loading={busy} onPress={handleSignUp} />

        <Link href="/(auth)/sign-in" asChild>
          <Pressable accessibilityRole="link" style={styles.switchLink}>
            <Text style={styles.switchText}>
              {t("auth.signUp.haveAccount")}{" "}
              <Text style={styles.switchStrong}>{t("auth.signUp.logIn")}</Text>
            </Text>
          </Pressable>
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: "center", gap: spacing(3), marginVertical: spacing(4) },
  logo: { width: 84, height: 84, borderRadius: 20 },
  wordmark: { color: colors.label, fontSize: font.x2, fontFamily: fonts.bold, fontWeight: "700" },
  error: { color: colors.red, fontSize: font.base, fontFamily: fonts.semibold, fontWeight: "600" },
  switchLink: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  switchText: { color: colors.label3, fontSize: font.base },
  switchStrong: { color: colors.label, fontWeight: "700" },
});
