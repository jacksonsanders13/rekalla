"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileV2, useSaveSection } from "@/hooks/use-assistant-v2";
import { SECTION_LABELS, type SectionKey } from "@/lib/v2-types";
import { renderSection } from "./section-fields";

export function SectionEditor({ userId, section }: { userId: string; section: SectionKey }) {
  const router = useRouter();
  const { data: profile } = useProfileV2(userId);
  const save = useSaveSection(userId, userId);
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (profile && draft === null) setDraft(JSON.parse(JSON.stringify(profile[section])));
  }, [profile, draft, section]);

  if (!profile || draft === null) {
    return <p className="text-xl text-label-3">Loading…</p>;
  }

  function onSave() {
    save.mutate({ section, value: draft }, { onSuccess: () => router.push("/profile") });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-label">{SECTION_LABELS[section]}</h1>
      <div className="space-y-5">{renderSection(section, draft, setDraft)}</div>
      <Button size="lg" className="w-full text-xl" onClick={onSave} loading={save.isPending}>
        <Check className="size-6" aria-hidden="true" /> Save
      </Button>
    </div>
  );
}
