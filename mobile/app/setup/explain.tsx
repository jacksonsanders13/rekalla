/**
 * What is about to happen, and why.
 *
 * The first version of setup went straight from "who is setting this up" to
 * "add a photo", which asks somebody to hand over a picture of their family
 * before telling them what it is for. This screen is the answer to that. It
 * is also the only place the method is explained, so it says what practice
 * is, what it is not, and what the next two minutes will involve.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { AppText } from "../../components/practice/text";
import { radius, space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

export default function Explain() {
  const colors = useTheme();
  return (
    <Screen
      title="Here is how this works"
      onBack={() => router.back()}
      footer={
        <ChunkyButton
          label="Let's add someone"
          hint="Starts adding the first person"
          onPress={() => router.push("/setup/person")}
        />
      }
    >
      <RekallaSays avatarSize={84}>
        <View style={{ gap: space(3) }}>
          <AppText size="body">
            You tell me about the people in your life. Their photo, their name,
            who they are to you.
          </AppText>
          <AppText size="body">
            Then I ask you about them. Today, tomorrow, a few days after that,
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
          Next: adding one person
        </AppText>
        <AppText color={colors.inkSoft}>
          Four short questions, one to a screen. A photo, their name, who they
          are to you, and anything you would like me to say back. Any of them
          can be left out.
        </AppText>
        <AppText color={colors.inkSoft}>
          Then we practise them straight away, so you can see what all this is
          for. It takes about a minute.
        </AppText>
      </View>
    </Screen>
  );
}
