import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { AssistantView } from "@/components/assistant/assistant-view";

export const metadata: Metadata = { title: "Ask Rekalla" };

export default async function AssistantPage() {
  const { user } = await requirePatient();
  return <AssistantView userId={user.id} />;
}
