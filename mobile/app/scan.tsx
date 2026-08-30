/**
 * The heart of Rekalla: photograph a paper document, let AI pull out the dates,
 * review, and add them to your calendar + reminders.
 */
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../lib/session";
import { colors, radius, fonts } from "../lib/theme";
import { a11y, a11yFont } from "../lib/a11y";
import { BigButton, BigField, BodyText } from "../components/big-ui";
import { takePhoto, pickPhoto, type PickedPhoto } from "../lib/photos";
import { scanPhoto, type ScanItem } from "../lib/scan";
import { useSaveScan } from "../hooks/scans";
import { syncReminderNotifications } from "../lib/notify";
import { isTransient } from "../lib/retry";
import { formatDay, formatTime } from "../lib/format";

type Phase = "choose" | "scanning" | "review" | "saving";

export default function ScanScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();
  const save = useSaveScan(userId);

  const [phase, setPhase] = useState<Phase>("choose");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [docType, setDocType] = useState("other");
  const [error, setError] = useState<string | null>(null);

  async function capture(kind: "camera" | "library") {
    setError(null);
    const p = kind === "camera" ? await takePhoto() : await pickPhoto();
    if (!p) return;
    setPhoto(p);
    setPhase("scanning");
    try {
      const res = await scanPhoto(p);
      setDocType(res.doc_type);
      setItems(res.items);
      setPhase("review");
    } catch {
      setError("I couldn't read that one. Lay the page flat in good light and try again.");
      setPhase("choose");
    }
  }

  function updateTitle(i: number, v: string) {
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, title: v } : it)));
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, j) => j !== i));
  }

  async function saveAll() {
    if (!photo || items.length === 0) return;
    setPhase("saving");
    setError(null);
    try {
      const { saved } = await save.mutateAsync({ photo, docType, items });
      await syncReminderNotifications(saved);
      router.replace("/(patient)/home");
    } catch (e) {
      // The photo is still in state, so "Add to my calendar" retries without
      // making them photograph the page again.
      setError(
        isTransient(e)
          ? "I couldn't save that just now. Check your connection and try again."
          : "I couldn't save that just now. Please try again.",
      );
      console.error("scan save failed", e);
      setPhase("review");
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ title: "Scan", headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {phase === "review" ? "Here's what I found" : "Scan"}
        </Text>
        <BigButton label="Close" icon="close" variant="secondary" onPress={() => router.back()} />
      </View>

      {phase === "choose" ? (
        <ScrollView contentContainerStyle={styles.body}>
          <BodyText>
            Take a photo of a paper calendar, an appointment card, or a bill.
            I'll pull out the dates and remind you.
          </BodyText>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <BigButton label="Take a photo" icon="camera" onPress={() => capture("camera")} />
          <BigButton label="Choose from photos" icon="images" variant="secondary" onPress={() => capture("library")} />
        </ScrollView>
      ) : null}

      {phase === "scanning" ? (
        <View style={styles.center}>
          {photo ? <Image source={{ uri: photo.previewUri }} style={styles.preview} /> : null}
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.reading}>Reading your paper…</Text>
        </View>
      ) : null}

      {phase === "review" || phase === "saving" ? (
        <ScrollView contentContainerStyle={styles.body}>
          {items.length === 0 ? (
            <>
              <BodyText>
                I didn't find any dates on that one. Try another photo.
              </BodyText>
              <BigButton label="Try another photo" icon="camera" onPress={() => setPhase("choose")} />
            </>
          ) : (
            <>
              <BodyText>Check these before I save them.</BodyText>
              {items.map((it, i) => (
                <View key={i} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Ionicons name={iconFor(it.type)} size={a11yFont.bodyLg} color={colors.blue} />
                    <Text style={styles.cardWhen}>
                      {formatDay(it.date)}
                      {it.time ? ` · ${formatTime(it.time)}` : ""}
                    </Text>
                  </View>
                  <BigField label="What is it?" value={it.title} onChangeText={(v) => updateTitle(i, v)} />
                  {it.location ? <Text style={styles.cardMeta}>{it.location}</Text> : null}
                  {it.amount ? <Text style={styles.cardMeta}>Amount: {it.amount}</Text> : null}
                  <BigButton label="Remove" icon="trash" variant="secondary" onPress={() => removeItem(i)} />
                </View>
              ))}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <BigButton
                label={phase === "saving" ? "Adding…" : `Add ${items.length} to my calendar`}
                icon="checkmark"
                onPress={saveAll}
                disabled={phase === "saving"}
              />
              <BigButton label="Start over" icon="camera" variant="secondary" onPress={() => setPhase("choose")} />
            </>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function iconFor(type: ScanItem["type"]): keyof typeof Ionicons.glyphMap {
  if (type === "bill") return "cash";
  if (type === "appointment") return "medkit";
  return "calendar";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: a11y.space(4),
    paddingVertical: a11y.space(3),
  },
  headerTitle: { color: colors.label, fontSize: a11yFont.title, fontFamily: fonts.bold, fontWeight: "700", flex: 1 },
  body: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(10) },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: a11y.space(4), padding: a11y.space(4) },
  preview: { width: 200, height: 260, borderRadius: radius.lg, resizeMode: "cover" },
  reading: { color: colors.label2, fontSize: a11yFont.bodyLg, fontFamily: fonts.semibold, fontWeight: "600" },
  error: { color: colors.red, fontSize: a11yFont.body, fontFamily: fonts.semibold, fontWeight: "600" },
  card: {
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: a11y.space(4),
    gap: a11y.space(3),
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: a11y.space(2) },
  cardWhen: { color: colors.label, fontSize: a11yFont.body, fontFamily: fonts.bold, fontWeight: "700" },
  cardMeta: { color: colors.label2, fontSize: a11yFont.body - 2 },
});
