import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { colors, font, radius, spacing } from "../lib/theme";
import { initials } from "../lib/utils";
import { useMyCaregivers, useRespondToCaregiver } from "../hooks/data";
import { PendingCaregivers } from "../components/pending-caregivers";
import { Screen, Card, Subtitle, SectionTitle, EmptyNote, Loading } from "../components/ui";

/** The patient's screen: their connect code + who's connected. */
export default function Connect() {
  const { session, profile, refreshProfile } = useSession();
  const t = useT();
  const patientId = session?.user.id ?? "";
  const caregivers = useMyCaregivers(patientId);
  // Declining a pending request and removing an active caregiver are the same
  // operation — both set the relationship to 'revoked'.
  const respond = useRespondToCaregiver(patientId);

  function confirmRemove(relationshipId: string, name: string) {
    Alert.alert(t("connect.removeTitle"), `${name}\n\n${t("connect.removeBody")}`, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("connect.removeConfirm"),
        style: "destructive",
        onPress: () =>
          respond.mutate(
            { relationshipId, approve: false },
            {
              // A trigger rotates the connect code on revoke, so pull the new one.
              onSuccess: () => {
                refreshProfile();
              },
              onError: () => Alert.alert(t("connect.removeFailed")),
            },
          ),
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: t("connect.caregivers") }} />
      <Screen>
        <Subtitle>{t("connect.subtitle")}</Subtitle>

        <PendingCaregivers />

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
          (caregivers.data ?? []).map((link) => {
            const name = link.profile.full_name || t("settings.caregiver");
            return (
              <View key={link.relationshipId} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {initials(link.profile.full_name)}
                  </Text>
                </View>
                <Text style={styles.name}>{name}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t("connect.remove")} ${name}`}
                  disabled={respond.isPending}
                  onPress={() => confirmRemove(link.relationshipId, name)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons name="close" size={20} color={colors.red} />
                  <Text style={styles.removeText}>{t("connect.remove")}</Text>
                </Pressable>
              </View>
            );
          })
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
  name: { color: colors.label, fontSize: font.lg, fontWeight: "700", flex: 1 },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    minHeight: 44,
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
    backgroundColor: "rgba(255,69,58,0.12)",
  },
  removeText: { color: colors.red, fontSize: font.sm, fontWeight: "700" },
});
