import { StyleSheet, Text, View } from "react-native";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { usePendingCaregivers, useRespondToCaregiver } from "../hooks/data";
import { Card, Button } from "./ui";
import { colors, font, spacing } from "../lib/theme";

/**
 * Shows caregiver connection requests waiting for the patient's approval, with
 * Approve / Decline. Until approved, the caregiver has no access. Renders
 * nothing for caregivers or when there are no pending requests.
 */
export function PendingCaregivers() {
  const { session, profile } = useSession();
  const t = useT();
  const patientId = session?.user.id ?? "";
  const pending = usePendingCaregivers(patientId);
  const respond = useRespondToCaregiver(patientId);

  if (profile?.account_type !== "patient") return null;

  const list = pending.data ?? [];
  if (list.length === 0) return null;

  return (
    <>
      {list.map((req) => (
        <Card key={req.relationshipId} style={styles.card}>
          <Text style={styles.title}>{t("connect.pendingTitle")}</Text>
          <Text style={styles.body}>
            {t("connect.pendingBody", {
              name: req.profile.full_name || t("settings.caregiver"),
            })}
          </Text>
          <View style={styles.row}>
            <Button
              label={t("connect.approve")}
              loading={respond.isPending}
              onPress={() =>
                respond.mutate({ relationshipId: req.relationshipId, approve: true })
              }
              style={{ flex: 1 }}
            />
            <Button
              label={t("connect.decline")}
              variant="secondary"
              onPress={() =>
                respond.mutate({ relationshipId: req.relationshipId, approve: false })
              }
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.blue, gap: spacing(2) },
  title: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
  body: { color: colors.label2, fontSize: font.base, lineHeight: 23 },
  row: { flexDirection: "row", gap: spacing(3), marginTop: spacing(2) },
});
