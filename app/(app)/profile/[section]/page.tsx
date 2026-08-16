import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePatient } from "@/lib/session";
import { SectionEditor } from "@/components/profile/section-editor";
import { SECTION_ORDER, SECTION_LABELS, type SectionKey } from "@/lib/v2-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const label = SECTION_LABELS[section as SectionKey];
  return { title: label ?? "Profile" };
}

export default async function ProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!SECTION_ORDER.includes(section as SectionKey)) notFound();
  const { user } = await requirePatient();
  return <SectionEditor userId={user.id} section={section as SectionKey} />;
}
