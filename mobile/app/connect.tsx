import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { colors, font, radius, spacing } from "../lib/theme";
import { initials } from "../lib/utils";
import { useMyCaregivers } from "../hooks/data";
import { Screen, Card, Subtitle, SectionTitle, EmptyNote, Loading } from "../components/ui";

/** The patient's screen: their connect code + who's connected. */
export default function Connect() {
  const { session, profile } = useSession();
  const t = useT();
  const patientId = session?.user.id ?? "";
  const caregivers = useMyCaregivers(patientId);

  return (
    <>
      <Stack.Screen options={{ title: t("connect.caregivers") }} />
      <Screen>
        <Subtitle>{t("connect.subtitle")}</Subtitle>

        <Card style={{ alignItems: "center" }}>
          <Text style={styles.codeLabel}>{t("connect.yourCode")}</Text>
          <Text style={styles.code}>{profile?.connect_code ?? "……"}</Text>
          <Text style={styles.codeHelp}>{t("connect.codeHelp")}</Text>
        </Card>

        <SectionTitle>{t("connect.caregivers")}</SectionTitle>
        {caregivers.isLoading ? (
          <Loading />
        ) : (caregivers.data ?? []).length === 0 ? (
          <EmptyNote>{t("connect.none")}</EmptyNote>
        ) : (
          (caregivers.data ?? []).map((link) => (
            <View key={link.relationshipId} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initials(link.profile.full_name)}
                </Text>
              </View>
              <Text style={styles.name}>
                {link.profile.full_name || t("settings.caregiver")}
              </Text>
            </View>
          ))
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  codeLabel: { color: colors.label3, fontSize: font.base },
  code: {
    color: colors.label,
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: 8,
  },
  codeHelp: {
    color: colors.label3,
    fontSize: font.base,
    lineHeight: 24,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(4),
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(10,132,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.blue, fontSize: font.base, fontWeight: "700" },
  name: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
});
