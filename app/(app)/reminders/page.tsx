import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { RemindersView } from "@/components/reminders/reminders-view";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const { user } = await requirePatient();

  return (
    <RemindersView
      userId={user.id}
      actorId={user.id}
      canManage
      description="Check things off as you go. Add anything you want to be reminded about — or just ask Rekalla."
    />
  );
}
