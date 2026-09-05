/**
 * What is about to happen, and why.
 *
 * The first version of setup went straight from "who is setting this up" to
 * "add a photo", which asks somebody to hand over a picture of their family
 * before telling them what it is for. This screen is the answer to that. It
 * is also the only place the method is explained, so it says what practice
 * is, what it is not, and what the next two minutes will involve.
 *
 * What it names as coming next is whatever they picked on the first question,
 * so the run of screens reads as one conversation rather than four forms.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { AppText } from "../../components/practice/text";
import { radius, space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";
import { usePractice } from "../../lib/practice/context";
import { TEMPLATES } from "../../lib/practice/templates";
import { SETUP_STEPS } from "./recall";

export default function Explain() {
  const colors = useTheme();
  const { user } = usePractice();
  const category = user?.wants?.[0] ?? "person";
  const template = TEMPLATES[category];
  const isPerson = category === "person";

  return (
    <Screen
      title="How this works"
      onBack={() => router.back()}
      progress={SETUP_STEPS / SETUP_STEPS}
      footer={
        <ChunkyButton
          label={isPerson ? "Add someone" : "Add the first one"}
          hint="Start adding"
          onPress={() => router.push("/setup/first-item")}
        />
      }
    >
      <RekallaSays avatarSize={84}>
        <View style={{ gap: space(3) }}>
          <AppText size="body">
            You tell me about something. A face and a name, part of your day,
            where you keep something.
          </AppText>
          <AppText size="body">
            Then I ask you about it. Today, tomorrow, then further apart each
            time you get it right.
          </AppText>
          <AppText size="body">
            If you can't remember, I show you the answer and ask again.
            Nothing is scored.
          </AppText>
        </View>
      </RekallaSays>

      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 2,
          borderColor: colors.line,
          borderRadius: radius.card,
          padding: space(5),
          gap: space(3),
        }}
      >
        <AppText size="bodyLarge" weight="bold">
          {`Next: ${template.label.toLowerCase()}`}
        </AppText>
        <AppText color={colors.inkSoft}>
          {`${template.fields.length} quick questions, one per screen. Skip any of them.`}
        </AppText>
        <AppText color={colors.inkSoft}>
          Then you practice it right away. Takes about a minute.
        </AppText>
      </View>
    </Screen>
  );
}
