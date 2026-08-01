import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { Card } from "./ui";
import { colors, font, spacing } from "../lib/theme";

/**
 * Lets a Loved One turn self-management on or off. When on, they can add and
 * edit their own reminders, routine, and memory bank. Hidden for caregivers.
 */
export function SelfManageToggle() {
  const { session, profile, refreshProfile } = useSession();
  const t = useT();
  const [busy, setBusy] = useState(false);

  if (profile?.account_type !== "patient") return null;

  const value = Boolean(profile?.self_managed);

  async function onToggle(next: boolean) {
    const id = session?.user.id;
    if (!id || busy) return;
    setBusy(true);
    await supabase.from("profiles").update({ self_managed: next }).eq("id", id);
    await refreshProfile();
    setBusy(false);
  }

  return (
    <Card>
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: spacing(3) }}>
          <Text style={styles.title}>{t("settings.selfManageTitle")}</Text>
          <Text style={styles.body}>{t("settings.selfManageBody")}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={busy}
          trackColor={{ false: colors.elev3, true: colors.green }}
          thumbColor="#ffffff"
          accessibilityLabel={t("settings.selfManageTitle")}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  title: { color: colors.label, fontSize: font.base, fontWeight: "700" },
  body: { color: colors.label3, fontSize: font.sm, marginTop: 2, lineHeight: 20 },
});
