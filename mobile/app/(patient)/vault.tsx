import { useMemo, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { useT } from "../../lib/i18n";
import { colors, font, radius, spacing } from "../../lib/theme";
import { useVaultItems } from "../../hooks/data";
import { Screen, Subtitle, EmptyNote, Loading } from "../../components/ui";

const CATEGORY_META: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  family: { label: "Family", icon: "people", color: colors.purple },
  contact: { label: "Contact", icon: "person", color: colors.blue },
  doctor: { label: "Doctor", icon: "medical", color: colors.teal },
  medication: { label: "Medication", icon: "medkit", color: colors.pink },
  important_date: { label: "Important date", icon: "calendar", color: colors.yellow },
  emergency: { label: "Emergency", icon: "alert-circle", color: colors.red },
  note: { label: "Note", icon: "document-text", color: colors.label3 },
};

export default function Vault() {
  const { session } = useSession();
  const t = useT();
  const userId = session?.user.id ?? "";
  const [query, setQuery] = useState("");
  const items = useVaultItems(userId);

  const visible = useMemo(() => {
    const list = items.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) =>
      [item.title, item.subtitle, item.notes, item.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items.data, query]);

  return (
    <Screen>
      <Subtitle>{t("vault.subtitle")}</Subtitle>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t("vault.search")}
        placeholderTextColor={colors.label4}
        style={styles.search}
        accessibilityLabel={t("vault.search")}
      />
      {items.isLoading ? (
        <Loading />
      ) : visible.length === 0 ? (
        <EmptyNote>{query ? t("vault.noMatch") : t("vault.empty")}</EmptyNote>
      ) : (
        visible.map((item) => {
          const meta = CATEGORY_META[item.category] ?? CATEGORY_META.note;
          return (
            <View key={item.id} style={styles.card}>
              {item.photo_url ? (
                <Image
                  source={{ uri: item.photo_url }}
                  style={styles.photo}
                  accessibilityLabel={`Photo of ${item.title}`}
                />
              ) : null}
              <View style={styles.top}>
                <View style={[styles.icon, { backgroundColor: `${meta.color}26` }]}>
                  <Ionicons name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {item.title}
                    {item.is_pinned ? "  ★" : ""}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                  ) : null}
                </View>
              </View>
              {item.phone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${item.title}`}
                  onPress={() =>
                    Linking.openURL(`tel:${item.phone!.replace(/[^+\d]/g, "")}`)
                  }
                  style={styles.callButton}
                >
                  <Ionicons name="call" size={20} color={colors.green} />
                  <Text style={styles.callText}>{item.phone}</Text>
                </Pressable>
              ) : null}
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.elev1,
    color: colors.label,
    paddingHorizontal: spacing(4),
    fontSize: font.base,
  },
  card: {
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(3),
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
  },
  top: { flexDirection: "row", gap: spacing(3), alignItems: "center" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
  subtitle: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: "rgba(48,209,88,0.12)",
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: spacing(4),
  },
  callText: { color: colors.green, fontSize: font.base, fontWeight: "700" },
  notes: { color: colors.label3, fontSize: font.base, lineHeight: 23 },
});
