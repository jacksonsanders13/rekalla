import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { RoutineView } from "@/components/routine/routine-view";

export const metadata: Metadata = { title: "Daily routine" };

export default async function RoutinePage() {
  const { user } = await requirePatient();

  return (
    <RoutineView
      userId={user.id}
      canManage
      description="Check off each step as your day goes on. Add the things you do every day."
    />
  );
}
