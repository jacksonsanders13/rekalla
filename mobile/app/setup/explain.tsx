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
      title="Here is how this works"
      onBack={() => router.back()}
      progress={SETUP_STEPS / SETUP_STEPS}
      footer={
        <ChunkyButton
          label={isPerson ? "Let's add someone" : "Let's add the first one"}
          hint="Starts the first one off"
          onPress={() => router.push("/setup/first-item")}
        />
      }
    >
      <RekallaSays avatarSize={84}>
        <View style={{ gap: space(3) }}>
          <AppText size="body">
            You tell me about something you want to keep hold of. A face and a
            name, a part of your day, wherever a thing lives.
          </AppText>
          <AppText size="body">
            Then I ask you about it. Today, tomorrow, a few days after that,
            leaving longer each time you get one right.
          </AppText>
          <AppText size="body">
            If one does not come to you, I show you the answer straight away and
            we go round again. There is nothing to get wrong here, and nothing
            is marked.
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
          {`${template.fields.length} short questions, one to a screen. Any of them can be left out.`}
        </AppText>
        <AppText color={colors.inkSoft}>
          Then we practise it straight away, so you can see what all this is
          for. It takes about a minute.
        </AppText>
      </View>
    </Screen>
  );
}
