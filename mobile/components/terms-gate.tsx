import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "../lib/session";
import { colors, font, radius, spacing } from "../lib/theme";

/**
 * Bump this version to force everyone to re-accept — e.g. when the placeholder
 * terms below are replaced with the real, legally binding agreement.
 */
const TERMS_VERSION = "2026-07-placeholder";
const keyFor = (userId: string) => `rekalla:terms-accepted:${TERMS_VERSION}:${userId}`;

/**
 * Shown once, the first time someone signs in (per terms version). They must
 * scroll to the bottom before "Accept" enables. Acceptance is remembered on the
 * device so it never nags again — until the terms version changes.
 *
 * The copy here is a placeholder and will be replaced with the real, legally
 * binding Terms of Use and Privacy Policy before launch.
 */
export function TermsGate() {
  const { session, loading } = useSession();
  const userId = session?.user.id;

  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(true);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    if (!userId) {
      setChecked(false);
      setScrolledToEnd(false);
      return;
    }
    AsyncStorage.getItem(keyFor(userId)).then((value) => {
      if (cancelled) return;
      setAccepted(value === "1");
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom <= 24) setScrolledToEnd(true);
  }

  async function accept() {
    if (!userId) return;
    await AsyncStorage.setItem(keyFor(userId), "1");
    setAccepted(true);
  }

  const visible = Boolean(userId) && checked && !accepted;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Before you begin</Text>
          <Text style={styles.subtitle}>
            Please review and accept our Terms of Use and Privacy Policy.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.heading}>Terms of Use & Privacy Policy</Text>
          <Text style={styles.meta}>Last updated: this is placeholder text</Text>

          {PLACEHOLDER_SECTIONS.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}

          <Text style={styles.finePrint}>
            This is placeholder text and does not constitute a legal agreement.
            The final, legally binding Terms of Use and Privacy Policy will
            replace it before Rekalla is publicly available. Rekalla is a memory
            and coordination aid, not a medical device, and does not provide
            medical advice.
          </Text>

          <Text style={styles.scrollHint}>
            {scrolledToEnd
              ? "Thanks for reading."
              : "Scroll to the bottom to continue."}
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !scrolledToEnd }}
            disabled={!scrolledToEnd}
            onPress={accept}
            style={({ pressed }) => [
              styles.acceptButton,
              !scrolledToEnd && styles.acceptButtonDisabled,
              pressed && scrolledToEnd && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.acceptLabel,
                !scrolledToEnd && styles.acceptLabelDisabled,
              ]}
            >
              {scrolledToEnd ? "Accept & continue" : "Scroll down to accept"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const PLACEHOLDER_SECTIONS = [
  {
    heading: "1. Welcome",
    body: "Rekalla helps you and the people who care for you keep track of reminders, daily routines, important people, and how you're feeling. By using Rekalla you agree to these terms. This section is placeholder text so you can see how the agreement will look and behave.",
  },
  {
    heading: "2. Your account",
    body: "You are responsible for keeping your sign-in details private. Loved One accounts and Caregiver accounts can be connected using a connect code. When you connect, a caregiver can help set up your reminders, routine, and memory bank on your behalf. Placeholder text continues here to fill out the section.",
  },
  {
    heading: "3. What we store",
    body: "Rekalla stores the information you or your caregiver add — reminders, routine steps, memory-bank entries, and wellness check-ins — so it can be shown back to you. Placeholder text: the real Privacy Policy will describe exactly what is collected, how long it is kept, and your choices about it.",
  },
  {
    heading: "4. What Rekalla is not",
    body: "Rekalla is a memory and coordination aid. It is not a medical device and does not give medical advice, diagnosis, or treatment. Always talk to a qualified professional about health decisions. This is placeholder wording that will be finalized before launch.",
  },
  {
    heading: "5. Sharing and connections",
    body: "You control who is connected to your account. A connection can be ended at any time. Caregivers only see the accounts they are actively connected to. Placeholder text continues to describe how connections and permissions work.",
  },
  {
    heading: "6. Changes to these terms",
    body: "We may update these terms from time to time. When we make meaningful changes, we'll ask you to review and accept the new version the next time you open the app. Placeholder text fills out the remainder of this section so there is enough to scroll through.",
  },
  {
    heading: "7. Contact",
    body: "Questions about these placeholder terms can be directed to the Rekalla team. The final agreement will include real contact details and the governing law. Thank you for helping test Rekalla during this early stage.",
  },
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  header: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
    paddingBottom: spacing(3),
    gap: spacing(2),
  },
  title: { color: colors.label, fontSize: font.x2, fontWeight: "700" },
  subtitle: { color: colors.label3, fontSize: font.base, lineHeight: 23 },
  scroll: {
    flex: 1,
    backgroundColor: colors.elev1,
    marginHorizontal: spacing(4),
    borderRadius: radius.lg,
  },
  scrollContent: { padding: spacing(5), gap: spacing(4) },
  heading: { color: colors.label, fontSize: font.xl, fontWeight: "700" },
  meta: { color: colors.label4, fontSize: font.sm, marginTop: -spacing(2) },
  section: { gap: spacing(2) },
  sectionHeading: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
  body: { color: colors.label2, fontSize: font.base, lineHeight: 25 },
  finePrint: {
    color: colors.label3,
    fontSize: font.sm,
    lineHeight: 22,
    marginTop: spacing(2),
  },
  scrollHint: {
    color: colors.label3,
    fontSize: font.sm,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing(2),
  },
  footer: { padding: spacing(4) },
  acceptButton: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.label,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing(5),
  },
  acceptButtonDisabled: { backgroundColor: colors.elev2 },
  acceptLabel: { color: "#000000", fontSize: font.base, fontWeight: "700" },
  acceptLabelDisabled: { color: colors.label4 },
});
