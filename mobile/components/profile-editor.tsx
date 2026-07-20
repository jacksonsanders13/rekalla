import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { colors, font, radius, spacing } from "../lib/theme";
import { Card, Button } from "./ui";

/** Shows the signed-in person's name + email, with inline editing of the name. */
export function ProfileEditor({ fallbackName }: { fallbackName: string }) {
  const { session, profile, refreshProfile } = useSession();
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!name.trim()) return setError(t("settings.nameNeeded"));
    if (!session) return;
    setBusy(true);
    const { error: saveError } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", session.user.id);
    setBusy(false);
    if (saveError) return setError(saveError.message);
    await refreshProfile();
    setEditing(false);
  }

  function startEdit() {
    setName(profile?.full_name ?? "");
    setError(null);
    setEditing(true);
  }

  if (editing) {
    return (
      <Card>
        <Text style={styles.fieldLabel}>{t("settings.yourName")}</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("settings.yourName")}
          placeholderTextColor={colors.label4}
          style={styles.input}
          autoFocus
        />
        <Button label={t("settings.saveName")} loading={busy} onPress={save} />
        <Button
          label={t("common.cancel")}
          variant="ghost"
          onPress={() => {
            setEditing(false);
            setError(null);
          }}
        />
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name || fallbackName}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.edit")}
          onPress={startEdit}
          style={styles.editBtn}
        >
          <Text style={styles.editText}>{t("common.edit")}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  name: { color: colors.label, fontSize: font.xl, fontWeight: "700" },
  email: { color: colors.label3, fontSize: font.base },
  fieldLabel: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
  error: { color: colors.red, fontSize: font.base, fontWeight: "600" },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
    color: colors.label,
    paddingHorizontal: spacing(4),
    fontSize: font.base,
  },
  editBtn: {
    minHeight: 44,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { color: colors.label, fontSize: font.base, fontWeight: "700" },
});
