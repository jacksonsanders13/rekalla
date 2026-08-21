/**
 * Per-section profile editor. One section at a time (chunked, resumable).
 * Reached from the profile overview; two nav levels total from home.
 */
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSession } from "../lib/session";
import { colors } from "../lib/theme";
import { a11y } from "../lib/a11y";
import { BigButton, BodyText } from "../components/big-ui";
import { renderSection } from "../components/section-fields";
import { useProfile, useSaveSection } from "../hooks/v2";
import { SECTION_LABELS, type SectionKey } from "../lib/v2-types";

export default function ProfileSectionEditor() {
  const { section } = useLocalSearchParams<{ section: SectionKey }>();
  const key = (section ?? "identity") as SectionKey;
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();
  const { data: profile } = useProfile(userId);
  const save = useSaveSection(userId, userId);

  const [draft, setDraft] = useState<any>(null);
  useEffect(() => {
    if (profile && draft === null) setDraft(JSON.parse(JSON.stringify(profile[key])));
  }, [profile]);

  if (!profile || draft === null) {
    return (
      <View style={styles.screen}>
        <BodyText>Loading…</BodyText>
      </View>
    );
  }

  function onSave() {
    save.mutate({ section: key, value: draft }, { onSuccess: () => router.back() });
  }

  return (
    <>
      <Stack.Screen options={{ title: SECTION_LABELS[key] }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {renderSection(key, draft, setDraft)}
        <BigButton
          label={save.isPending ? "Saving…" : "Save"}
          icon="checkmark"
          onPress={onSave}
          disabled={save.isPending}
          accessibilityLabel={`Save ${SECTION_LABELS[key]}`}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(12) },
});
