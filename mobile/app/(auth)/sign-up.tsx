import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n";
import { colors, font, radius, spacing } from "../../lib/theme";
import { Screen, Card, Button, Field, Title, Subtitle } from "../../components/ui";
import type { AccountType } from "../../lib/types";

const OPTIONS: {
  value: AccountType;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  detailKey: string;
}[] = [
  {
    value: "patient",
    icon: "person",
    titleKey: "auth.signUp.patient",
    detailKey: "auth.signUp.patientDetail",
  },
  {
    value: "caregiver",
    icon: "heart",
    titleKey: "auth.signUp.caregiver",
    detailKey: "auth.signUp.caregiverDetail",
  },
];

export default function SignUp() {
  const t = useT();
  const [accountType, setAccountType] = useState<AccountType>("patient");
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
        data: { full_name: fullName.trim(), account_type: accountType },
      },
    });

    if (signUpError) {
      setBusy(false);
      return setError(signUpError.message);
    }

    if (!data.session) {
      setBusy(false);
      return setError(t("auth.err.confirm"));
    }

    if (data.user) {
      await supabase
        .from("profiles")
        .update({ account_type: accountType })
        .eq("id", data.user.id);
    }

    router.replace(
      accountType === "caregiver" ? "/(caregiver)/people" : "/(patient)/summary",
    );
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

        <Text style={styles.legend}>{t("auth.signUp.who")}</Text>
        <View style={{ gap: spacing(3) }}>
          {OPTIONS.map((option) => {
            const selected = accountType === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setAccountType(option.value)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View
                  style={[styles.optionIcon, selected && styles.optionIconSelected]}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={selected ? "#000" : colors.label2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{t(option.titleKey)}</Text>
                  <Text style={styles.optionDetail}>{t(option.detailKey)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

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
  wordmark: { color: colors.label, fontSize: font.x2, fontWeight: "700" },
  error: { color: colors.red, fontSize: font.base, fontWeight: "600" },
  legend: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.elev2,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: "transparent",
    padding: spacing(4),
  },
  optionSelected: {
    borderColor: colors.label,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.elev3,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: { backgroundColor: colors.label },
  optionTitle: { color: colors.label, fontSize: font.base, fontWeight: "700" },
  optionDetail: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
  switchLink: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  switchText: { color: colors.label3, fontSize: font.base },
  switchStrong: { color: colors.label, fontWeight: "700" },
});
