import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const { user } = await requirePatient();
  return <CalendarView userId={user.id} />;
}
