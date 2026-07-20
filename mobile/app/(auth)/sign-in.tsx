import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n";
import { colors, font, spacing } from "../../lib/theme";
import { Screen, Card, Button, Field, Title, Subtitle } from "../../components/ui";

export default function SignIn() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setBusy(false);
      return setError(
        signInError.message === "Invalid login credentials"
          ? t("auth.signIn.badCredentials")
          : signInError.message,
      );
    }

    let destination = "/(patient)/summary";
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single();
      if (profile?.account_type === "caregiver") {
        destination = "/(caregiver)/people";
      }
    }
    router.replace(destination as never);
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
        <Title>{t("auth.signIn.title")}</Title>
        <Subtitle>{t("auth.signIn.subtitle")}</Subtitle>

        {error && <Text style={styles.error}>{error}</Text>}

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
          autoComplete="current-password"
          placeholder={t("auth.signIn.passwordPlaceholder")}
        />

        <Button label={t("auth.signIn.button")} loading={busy} onPress={handleSignIn} />

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link" style={styles.switchLink}>
            <Text style={styles.forgotText}>{t("auth.signIn.forgot")}</Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable accessibilityRole="link" style={styles.switchLink}>
            <Text style={styles.switchText}>
              {t("auth.signIn.noAccount")}{" "}
              <Text style={styles.switchStrong}>{t("auth.signIn.create")}</Text>
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
  wordmark: { color: colors.label, fontSize: font.x2, fontWeight: "700" },
  error: { color: colors.red, fontSize: font.base, fontWeight: "600" },
  switchLink: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  switchText: { color: colors.label3, fontSize: font.base },
  switchStrong: { color: colors.label, fontWeight: "700" },
  forgotText: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
});
