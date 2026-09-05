/**
 * The photo on a practice card.
 *
 * The label is deliberately vague. VoiceOver reads it out before the options,
 * and a label like "photo of Ellie" would answer the question for anyone
 * using it. Sighted and non-sighted users get the same question.
 */
import { View, Image } from "react-native";
import { radius, space } from "../../lib/design/tokens";
import { usePhotoUri } from "../../lib/practice/photos";
import { AppText } from "./text";
import { useTheme } from "../../lib/design/theme";

export function MemoryPhoto({ photoKey }: { photoKey: string | null }) {
  const colors = useTheme();
  const uri = usePhotoUri(photoKey);
  if (!photoKey) return null;

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: "100%",
          maxWidth: 340,
          minHeight: 240,
          aspectRatio: 1,
          borderRadius: radius.photo,
          backgroundColor: colors.card,
          borderWidth: 2,
          borderColor: colors.line,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            accessibilityLabel="The photo for this question"
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <AppText color={colors.inkSoft} center style={{ padding: space(4) }}>
            This photo could not be opened.
          </AppText>
        )}
      </View>
    </View>
  );
}
