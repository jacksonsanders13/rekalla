import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/session";
import { colors, font } from "../lib/theme";
import { Screen, Card, Button } from "../components/ui";

/** Shared settings screen (patients reach it from the Summary header). */
export default function Settings() {
  const { session, profile } = useSession();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.name}>{profile?.full_name || "You"}</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.label, fontSize: font.xl, fontWeight: "700" },
  email: { color: colors.label3, fontSize: font.base },
});
