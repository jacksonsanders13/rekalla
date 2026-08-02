import { router } from "expo-router";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { Button } from "./ui";

/**
 * Shown to self-managed patients: opens the full add/edit screen for their own
 * reminders, routine, and memory bank. Renders nothing for caregiver-managed
 * accounts (their reminders stay read-only).
 *
 * `labelKey` names what the current screen manages — the destination is the
 * same editor either way, so a single shared label read wrong on two of the
 * three screens.
 */
export function ManageButton({ labelKey }: { labelKey: string }) {
  const { session, profile } = useSession();
  const t = useT();

  if (!profile?.self_managed) return null;
  const id = session?.user.id;
  if (!id) return null;

  return (
    <Button
      label={t(labelKey)}
      variant="secondary"
      onPress={() =>
        router.push({
          pathname: "/patient/[id]",
          params: { id, name: profile.full_name || t("settings.you") },
        })
      }
    />
  );
}
