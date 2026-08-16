import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { BigButton, BodyText } from "../../components/big-ui";

/**
 * v2 "My Day" hub. Collapses the old granular tabs (reminders/routine/vault/
 * wellness/summary) into one calm screen of large buttons, so the elder sees
 * only THREE tabs total (Rekalla, My Day, Profile). Each button is one tap to
 * an existing screen — two nav levels from home, never more.
 */
const LINKS: { href: string; label: string; icon: Parameters<typeof BigButton>[0]["icon"] }[] = [
  { href: "/(patient)/summary", label: "Today at a glance", icon: "sunny" },
  { href: "/(patient)/reminders", label: "My reminders", icon: "notifications" },
  { href: "/(patient)/routine", label: "My routine", icon: "checkmark-circle" },
  { href: "/(patient)/vault", label: "My photos & notes", icon: "book" },
  { href: "/(patient)/wellness", label: "How I'm feeling", icon: "heart" },
];

export default function MyDayScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          My day
        </Text>
        <BodyText>Everything about your day, in one place.</BodyText>
        {LINKS.map((l) => (
          <BigButton
            key={l.href}
            label={l.label}
            icon={l.icon}
            variant="secondary"
            style={styles.button}
            onPress={() => router.push(l.href as never)}
            accessibilityLabel={l.label}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(10) },
  title: { color: colors.label, fontSize: a11yFont.title, fontWeight: "700" },
  button: { justifyContent: "flex-start", minHeight: 72 },
});
