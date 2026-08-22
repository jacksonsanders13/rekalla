import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { ScanView } from "@/components/scan/scan-view";

export const metadata: Metadata = { title: "Scan" };

export default async function ScanPage() {
  const { user } = await requirePatient();
  return <ScanView userId={user.id} />;
}
