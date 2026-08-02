import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../lib/i18n";
import { Card } from "./ui";
import { colors, font, spacing } from "../lib/theme";

const TERMS_URL = "https://rekalla.app/terms";
const PRIVACY_URL = "https://rekalla.app/privacy";

/** Links to the hosted Terms of Use and Privacy Policy, shown in Settings. */
export function LegalLinks() {
  const t = useT();

  return (
    <Card style={{ paddingVertical: spacing(1) }}>
      <Row label={t("settings.terms")} onPress={() => Linking.openURL(TERMS_URL)} />
      <View style={styles.divider} />
      <Row label={t("settings.privacy")} onPress={() => Linking.openURL(PRIVACY_URL)} />
    </Card>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="open-outline" size={20} color={colors.label3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing(2),
  },
  label: { color: colors.label, fontSize: font.base, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.elev3 },
});
