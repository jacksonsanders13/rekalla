/**
 * The first thing added, during setting up.
 *
 * Which template this is depends on what they said they wanted to recall on
 * the first question — that answer has to do something, or it was a survey.
 *
 * Saving goes straight into a real practice session on it. That is the moment
 * the app is worth having: somebody looks at a photo of their granddaughter,
 * picks her name out, and gets it right. Nothing is allowed to stand between
 * setting up and that, least of all a sign-up form.
 */
import { router } from "expo-router";
import { AddFlow } from "../../components/practice/add-flow";
import { usePractice } from "../../lib/practice/context";
import { TEMPLATES } from "../../lib/practice/templates";

export default function FirstItem() {
  const { user, addItem } = usePractice();
  const category = user?.wants?.[0] ?? "person";

  return (
    <AddFlow
      template={TEMPLATES[category]}
      finishLabel="Save"
      onCancel={() => router.back()}
      onDone={async (values, photoBase64) => {
        const item = await addItem({ category, values, photoBase64 });
        router.replace({
          pathname: "/practice",
          params: { mode: "intro", itemId: item.id },
        });
      }}
    />
  );
}
