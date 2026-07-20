import { router, Stack } from "expo-router";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n";
import { Screen, Card, Button } from "../components/ui";
import { ProfileEditor } from "../components/profile-editor";
import { LanguagePicker } from "../components/language-picker";
import { DeleteAccount } from "../components/delete-account";

/** Shared settings screen (patients reach it from the Summary header). */
export default function Settings() {
  const t = useT();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <>
      <Stack.Screen options={{ title: t("tab.account") }} />
      <Screen>
        <ProfileEditor fallbackName={t("settings.you")} />
        <LanguagePicker />
        <Card>
          <Button label={t("common.signOut")} variant="secondary" onPress={signOut} />
        </Card>
        <DeleteAccount />
      </Screen>
    </>
  );
}
