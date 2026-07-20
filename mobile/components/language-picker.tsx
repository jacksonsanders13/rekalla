import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n, type Lang } from "../lib/i18n";
import { colors, font, radius, spacing } from "../lib/theme";
import { Card } from "./ui";

const OPTIONS: { value: Lang; labelKey: string }[] = [
  { value: "en", labelKey: "settings.english" },
  { value: "es", labelKey: "settings.spanish" },
];

/** Language toggle (English / Español). */
export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  return (
    <Card>
      <Text style={styles.label}>{t("settings.language")}</Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const active = lang === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setLang(option.value)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
  row: { flexDirection: "row", gap: spacing(2) },
  pill: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: { backgroundColor: colors.label },
  pillText: { color: colors.label2, fontSize: font.base, fontWeight: "700" },
  pillTextActive: { color: "#000000" },
});
