import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { HomeView } from "@/components/home/home-view";

export const metadata: Metadata = { title: "Rekalla" };

export default async function HomePage() {
  const { user } = await requirePatient();
  return <HomeView userId={user.id} />;
}
