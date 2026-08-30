/** Basic account settings: name, phone, email, log out, legal, delete. */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/session";
import { colors, radius, fonts } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { BigButton, BigField } from "../../components/big-ui";
import { LegalLinks } from "../../components/legal-links";
import { DeleteAccount } from "../../components/delete-account";
import { clearPersistedQueries } from "../../lib/query-persist";

export default function Profile() {
  const queryClient = useQueryClient();
  const { session, profile, refreshProfile } = useSession();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(((profile as any)?.phone as string | undefined) ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!session) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const { error: e } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq("id", session.user.id);
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    await refreshProfile();
    setSaved(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
    // The calendar is cached on the device so it reads without a signal.
    // Clear it here, or the next person to open the app on this phone would
    // see the previous account's appointments.
    queryClient.clear();
    await clearPersistedQueries();
    router.replace("/(auth)/sign-in");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title} accessibilityRole="header">Profile</Text>

        <View style={styles.card}>
          <BigField label="Name" value={name} onChangeText={setName} />
          <BigField label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Text style={styles.email}>Email: {session?.user.email}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saved ? <Text style={styles.saved}>Saved.</Text> : null}
          <BigButton label={busy ? "Saving…" : "Save"} icon="checkmark" onPress={save} disabled={busy} />
        </View>

        <LegalLinks />

        <BigButton label="Log out" icon="log-out" variant="secondary" onPress={signOut} />

        <DeleteAccount />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  body: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(10) },
  title: { color: colors.label, fontSize: a11yFont.title, fontFamily: fonts.bold, fontWeight: "700", textAlign: "center" },
  card: { backgroundColor: colors.elev1, borderRadius: radius.lg, padding: a11y.space(4), gap: a11y.space(3) },
  email: { color: colors.label3, fontSize: a11yFont.body },
  error: { color: colors.red, fontSize: a11yFont.body, fontFamily: fonts.semibold, fontWeight: "600" },
  saved: { color: colors.green, fontSize: a11yFont.body, fontFamily: fonts.semibold, fontWeight: "600" },
});
