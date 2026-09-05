/**
 * The first person, added during setup.
 *
 * Saving goes straight into a real practice session on that person. That is
 * the moment the app is worth having: somebody looks at a photo of their
 * granddaughter, picks her name out, and gets it right. Nothing is allowed
 * to stand between setting up and that, least of all a sign-up form.
 */
import { router } from "expo-router";
import { AddFlow } from "../../components/practice/add-flow";
import { usePractice } from "../../lib/practice/context";
import { TEMPLATES } from "../../lib/practice/templates";

export default function SetupPerson() {
  const { addItem } = usePractice();

  return (
    <AddFlow
      template={TEMPLATES.person}
      finishLabel="Save"
      onCancel={() => router.back()}
      onDone={async (values, photoBase64) => {
        const item = await addItem({ category: "person", values, photoBase64 });
        router.replace({
          pathname: "/practice",
          params: { mode: "intro", itemId: item.id },
        });
      }}
    />
  );
}
