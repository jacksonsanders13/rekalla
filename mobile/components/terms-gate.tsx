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
import { useT } from "../lib/i18n";
import { colors, font, radius, spacing } from "../lib/theme";

/**
 * Bump this version to force everyone to re-accept when the agreement changes
 * in a meaningful way.
 */
const TERMS_VERSION = "2026-08-v1";
const keyFor = (userId: string) => `rekalla:terms-accepted:${TERMS_VERSION}:${userId}`;

/**
 * Shown once, the first time someone signs in (per terms version). They must
 * scroll to the bottom before "Accept" enables. Acceptance is remembered on the
 * device so it never nags again — until the terms version changes.
 *
 * NOTE: This is the plain-language agreement users accept in-app. The full
 * Terms of Use and Privacy Policy are also hosted at rekalla.app/terms and
 * rekalla.app/privacy. Have any wording changes reviewed before shipping.
 */
export function TermsGate({ onResolved }: { onResolved?: () => void }) {
  const { session, loading } = useSession();
  const t = useT();
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
      const already = value === "1";
      setAccepted(already);
      setChecked(true);
      if (already) onResolved?.();
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
    onResolved?.();
  }

  const visible = Boolean(userId) && checked && !accepted;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("terms.header")}</Text>
          <Text style={styles.subtitle}>{t("terms.sub")}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.heading}>Terms of Use & Privacy Policy</Text>
          <Text style={styles.meta}>Rekalla LLC · Last updated August 2026</Text>

          {TERMS_SECTIONS.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}

          <Text style={styles.finePrint}>
            The full Terms of Use and Privacy Policy are available at
            rekalla.app/terms and rekalla.app/privacy. By tapping Accept you
            confirm you have read and agree to them.
          </Text>

          <Text style={styles.scrollHint}>
            {scrolledToEnd ? t("terms.thanks") : t("terms.scrollHint")}
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
              {scrolledToEnd ? t("terms.accept") : t("terms.scrollDown")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const TERMS_SECTIONS = [
  {
    heading: "1. About this agreement",
    body: "Rekalla is operated by Rekalla LLC (\"Rekalla,\" \"we,\" \"us\"). These Terms of Use are an agreement between you and Rekalla LLC. By tapping Accept and by using the app, you agree to these terms and to our Privacy Policy. If you do not agree, please do not use Rekalla.",
  },
  {
    heading: "2. Rekalla is not medical care",
    body: "Rekalla is a memory and coordination aid. It is not a medical device and does not provide medical advice, diagnosis, or treatment, and it does not replace professional care. Always talk to a qualified professional about health decisions. In an emergency, call your local emergency number — do not rely on Rekalla.",
  },
  {
    heading: "3. Reminders are not guaranteed",
    body: "Reminders and notifications depend on your device, its settings, battery, and network, and may be delayed, missed, or not delivered. Do not rely on Rekalla as your only way to remember medication, appointments, or other important or health-related tasks. You are responsible for these tasks whether or not a reminder appears.",
  },
  {
    heading: "4. Who can use Rekalla",
    body: "You must be at least 18 years old to create an account. By using Rekalla, you confirm that you are 18 or older and are able to enter into this agreement. Rekalla is intended for adults and is not directed to children under 13.",
  },
  {
    heading: "5. Your account",
    body: "You are responsible for keeping your sign-in details private and for activity that happens under your account. Please use a password you don't use elsewhere, and let us know if you believe your account has been used without your permission.",
  },
  {
    heading: "6. Caregivers and connections",
    body: "Loved One and Caregiver accounts can be linked using a connect code. A connected caregiver can view and help manage the Loved One's reminders, routine, and memory bank. Only share your connect code with people you trust. You can end a connection at any time from the app, which removes that caregiver's access going forward.",
  },
  {
    heading: "7. Your content",
    body: "You are responsible for the information you add to Rekalla, including that you have the right to add any other person's details (such as a family member's phone number). Do not add unlawful content or anything you do not have permission to store.",
  },
  {
    heading: "8. Privacy",
    body: "Our Privacy Policy explains what information we collect, how it is used, how it is stored with our provider Supabase, and your choices — including deleting your account and all its data from Settings. By using Rekalla you agree to the Privacy Policy at rekalla.app/privacy.",
  },
  {
    heading: "9. Provided \"as is\"",
    body: "Rekalla is provided on an \"as is\" and \"as available\" basis, without warranties of any kind, whether express or implied. We do not warrant that the app will be uninterrupted, error-free, secure, or that reminders or data will always be available or accurate.",
  },
  {
    heading: "10. Limitation of liability",
    body: "To the fullest extent permitted by law, Rekalla LLC and its owners will not be liable for any indirect, incidental, special, or consequential damages, or for any harm, loss, or injury arising from your use of or reliance on Rekalla — including missed or late reminders or loss of data. Some places do not allow certain limitations, so parts of this may not apply to you.",
  },
  {
    heading: "11. Changes to these terms",
    body: "We may update these terms from time to time. When we make meaningful changes, we will ask you to review and accept the new version the next time you open the app. Continuing to use Rekalla after an update means you accept the updated terms.",
  },
  {
    heading: "12. Governing law and contact",
    body: "These terms are governed by the laws of the State of Delaware, United States, without regard to its conflict-of-laws rules. Questions about these terms or your data can be sent to madmanjack8@gmail.com.",
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
