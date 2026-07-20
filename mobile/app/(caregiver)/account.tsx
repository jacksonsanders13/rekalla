import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n";
import { Screen, Card, Button } from "../../components/ui";
import { ProfileEditor } from "../../components/profile-editor";
import { LanguagePicker } from "../../components/language-picker";
import { DeleteAccount } from "../../components/delete-account";

export default function CaregiverAccount() {
  const t = useT();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen>
      <ProfileEditor fallbackName={t("settings.caregiver")} />
      <LanguagePicker />
      <Card>
        <Button label={t("common.signOut")} variant="secondary" onPress={signOut} />
      </Card>
      <DeleteAccount />
    </Screen>
  );
}
