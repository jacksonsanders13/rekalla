import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n";
import { colors, font } from "../../lib/theme";
import { Screen, Card, Button, Field, Title, Subtitle } from "../../components/ui";

export default function ForgotPassword() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setError(null);
    if (!email.trim()) return setError(t("auth.forgot.needEmail"));
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
    );
    setBusy(false);
    if (resetError) return setError(resetError.message);
    setSent(true);
  }

  return (
    <Screen>
      <Card>
        <Title>{t("auth.forgot.title")}</Title>
        {sent ? (
          <>
            <Subtitle>{t("auth.forgot.sent", { email: email.trim() })}</Subtitle>
            <Link href="/(auth)/sign-in" asChild>
              <Button label={t("auth.forgot.back")} variant="secondary" />
            </Link>
          </>
        ) : (
          <>
            <Subtitle>{t("auth.forgot.subtitle")}</Subtitle>

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

            <Button label={t("auth.forgot.button")} loading={busy} onPress={handleSend} />

            <Link href="/(auth)/sign-in" asChild>
              <Pressable accessibilityRole="link" style={styles.link}>
                <Text style={styles.linkText}>{t("auth.forgot.back")}</Text>
              </Pressable>
            </Link>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.red, fontSize: font.base, fontWeight: "600" },
  link: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  linkText: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
});
