import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { colors, font, radius, spacing } from "../lib/theme";

const VERSION = "v1";
const keyFor = (userId: string) => `rekalla:welcome-seen:${VERSION}:${userId}`;

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  bodyKey: string;
}

const PATIENT_SLIDES: Slide[] = [
  { icon: "sunny-outline", titleKey: "tour.p1.title", bodyKey: "tour.p1.body" },
  {
    icon: "checkmark-circle-outline",
    titleKey: "tour.p2.title",
    bodyKey: "tour.p2.body",
  },
  { icon: "heart-outline", titleKey: "tour.p3.title", bodyKey: "tour.p3.body" },
];

const CAREGIVER_SLIDES: Slide[] = [
  { icon: "people-outline", titleKey: "tour.c1.title", bodyKey: "tour.c1.body" },
  { icon: "key-outline", titleKey: "tour.c2.title", bodyKey: "tour.c2.body" },
  { icon: "create-outline", titleKey: "tour.c3.title", bodyKey: "tour.c3.body" },
];

/**
 * A short, one-time walkthrough shown the first time someone signs in.
 * `enabled` is passed once the terms gate is resolved, so the tour never
 * competes with the terms screen for the foreground.
 */
export function WelcomeTour({ enabled }: { enabled: boolean }) {
  const { session, profile, loading } = useSession();
  const t = useT();
  const userId = session?.user.id;

  const [checked, setChecked] = useState(false);
  const [seen, setSeen] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    if (!userId) {
      setChecked(false);
      setStep(0);
      return;
    }
    AsyncStorage.getItem(keyFor(userId)).then((value) => {
      if (cancelled) return;
      setSeen(value === "1");
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  const slides =
    profile?.account_type === "caregiver" ? CAREGIVER_SLIDES : PATIENT_SLIDES;
  const isLast = step >= slides.length - 1;
  const slide = slides[step];

  async function finish() {
    if (userId) await AsyncStorage.setItem(keyFor(userId), "1");
    setSeen(true);
  }

  const visible = enabled && Boolean(userId) && checked && !seen;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <Pressable
            accessibilityRole="button"
            onPress={finish}
            style={styles.skip}
          >
            <Text style={styles.skipText}>{t("tour.skip")}</Text>
          </Pressable>

          <View style={styles.body}>
            <View style={styles.iconWrap}>
              <Ionicons name={slide.icon} size={56} color={colors.label} />
            </View>
            <Text style={styles.title}>{t(slide.titleKey)}</Text>
            <Text style={styles.text}>{t(slide.bodyKey)}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === step && styles.dotActive]}
                />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
              style={({ pressed }) => [
                styles.button,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.buttonText}>
                {isLast ? t("tour.start") : t("tour.next")}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base, padding: spacing(6) },
  skip: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", paddingHorizontal: spacing(2) },
  skipText: { color: colors.label3, fontSize: font.base, fontWeight: "600" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing(5) },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: colors.elev1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.label,
    fontSize: font.x2,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  text: {
    color: colors.label3,
    fontSize: font.lg,
    lineHeight: 27,
    textAlign: "center",
    maxWidth: 340,
  },
  footer: { gap: spacing(5) },
  dots: { flexDirection: "row", gap: spacing(2), justifyContent: "center" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.elev3,
  },
  dotActive: { backgroundColor: colors.label, width: 22 },
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.label,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#000000", fontSize: font.base, fontWeight: "700" },
});
