import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, font, radius, spacing } from "../../lib/theme";
import { initials } from "../../lib/utils";
import { useMyPatients, useConnectWithCode } from "../../hooks/data";
import { Screen, Card, Button, Subtitle, SectionTitle, EmptyNote, Loading } from "../../components/ui";

export default function People() {
  const { session } = useSession();
  const caregiverId = session?.user.id ?? "";
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const patients = useMyPatients(caregiverId);
  const connect = useConnectWithCode(caregiverId);

  function handleConnect() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setMessage(null);
    connect.mutate(trimmed, {
      onSuccess: (patient) => {
        setCode("");
        setMessage({
          text: `Connected to ${patient.full_name || "your person"}.`,
          ok: true,
        });
      },
      onError: (error) => setMessage({ text: error.message, ok: false }),
    });
  }

  return (
    <Screen>
      <Subtitle>Everyone you help care for, in one place.</Subtitle>

      <Card>
        <Text style={styles.cardTitle}>Connect to someone</Text>
        <Text style={styles.cardBody}>
          Ask the person you care for to open Rekalla and read you their
          connect code, then type it in here.
        </Text>
        {message && (
          <Text style={[styles.message, { color: message.ok ? colors.green : colors.red }]}>
            {message.text}
          </Text>
        )}
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
          placeholder="e.g. R7K2QX"
          placeholderTextColor={colors.label4}
          style={styles.codeInput}
          accessibilityLabel="Their connect code"
        />
        <Button label="Connect" loading={connect.isPending} onPress={handleConnect} />
      </Card>

      <SectionTitle>People I care for</SectionTitle>
      {patients.isLoading ? (
        <Loading />
      ) : (patients.data ?? []).length === 0 ? (
        <EmptyNote>
          No one connected yet. Enter a connect code above and they&apos;ll
          appear here.
        </EmptyNote>
      ) : (
        (patients.data ?? []).map((link) => (
          <Link
            key={link.relationshipId}
            href={{ pathname: "/patient/[id]", params: { id: link.profile.id, name: link.profile.full_name } }}
            asChild
          >
            <Pressable accessibilityRole="button" style={styles.personRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initials(link.profile.full_name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>
                  {link.profile.full_name || "Patient"}
                </Text>
                <Text style={styles.personMeta}>
                  Reminders, routine & memory bank
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.label4} />
            </Pressable>
          </Link>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: colors.label, fontSize: font.xl, fontWeight: "700" },
  cardBody: { color: colors.label3, fontSize: font.base, lineHeight: 24 },
  message: { fontSize: font.base, fontWeight: "600" },
  codeInput: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
    color: colors.label,
    paddingHorizontal: spacing(4),
    fontSize: font.xl,
    fontWeight: "700",
    letterSpacing: 6,
    textAlign: "center",
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(4),
    backgroundColor: colors.elev1,
    borderRadius: radius.xl,
    padding: spacing(4),
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(191,90,242,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.purple, fontSize: font.lg, fontWeight: "700" },
  personName: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
  personMeta: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
});
