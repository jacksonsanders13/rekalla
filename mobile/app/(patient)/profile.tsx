import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, radius } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { useProfile, sectionState, overallProgress } from "../../hooks/v2";
import { BodyText } from "../../components/big-ui";
import { SECTION_ORDER, SECTION_LABELS } from "../../lib/v2-types";
import type { SectionState } from "../../lib/v2-types";

const STATE_META: Record<SectionState, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  empty: { label: "Not started", icon: "ellipse-outline", color: colors.label3 },
  partial: { label: "In progress", icon: "time-outline", color: colors.orange },
  complete: { label: "Done", icon: "checkmark-circle", color: colors.green },
};

export default function ProfileScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();
  const { data: profile, isLoading } = useProfile(userId);

  const progress = profile ? overallProgress(profile) : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Your profile
        </Text>
        <BodyText>
          This helps Rekalla know you. You can do a little at a time and come
          back whenever you like. Nothing here is about your health.
        </BodyText>

        <View
          style={styles.progressCard}
          accessibilityLabel={`Profile ${progress} percent complete`}
        >
          <Text style={styles.progressPct}>{progress}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>complete</Text>
        </View>

        {isLoading || !profile ? (
          <BodyText>Loading your profile…</BodyText>
        ) : (
          SECTION_ORDER.map((key) => {
            const st = sectionState(profile, key);
            const meta = STATE_META[st];
            return (
              <View
                key={key}
                style={styles.sectionCard}
                accessibilityRole="button"
                accessibilityLabel={`${SECTION_LABELS[key]}, ${meta.label}. Tap to edit.`}
                onTouchEnd={() => router.push({ pathname: "/profile-section", params: { section: key } })}
              >
                <View style={styles.sectionMain}>
                  <Text style={styles.sectionName}>{SECTION_LABELS[key]}</Text>
                  <View style={styles.statusRow}>
                    <Ionicons name={meta.icon} size={a11yFont.body} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={28} color={colors.label3} />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(10) },
  title: { color: colors.label, fontSize: a11yFont.title, fontWeight: "700" },
  progressCard: {
    backgroundColor: colors.elev1,
    borderRadius: radius.xl,
    padding: a11y.space(5),
    gap: a11y.space(3),
    alignItems: "center",
  },
  progressPct: { color: colors.label, fontSize: a11yFont.hero, fontWeight: "800" },
  progressTrack: {
    width: "100%",
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.elev3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.green },
  progressLabel: { color: colors.label2, fontSize: a11yFont.body },
  sectionCard: {
    minHeight: 72,
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: a11y.space(4),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionMain: { gap: a11y.space(2), flex: 1 },
  sectionName: { color: colors.label, fontSize: a11yFont.bodyLg, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: a11y.space(2) },
  statusText: { fontSize: a11yFont.body, fontWeight: "600" },
});
