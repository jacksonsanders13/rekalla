"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn, firstName } from "@/lib/utils";
import { RemindersView } from "@/components/reminders/reminders-view";
import { RoutineView } from "@/components/routine/routine-view";
import { VaultView } from "@/components/vault/vault-view";
import { WellnessView } from "@/components/wellness/wellness-view";

type Section = "reminders" | "routine" | "vault" | "wellness";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "reminders", label: "Reminders" },
  { id: "routine", label: "Routine" },
  { id: "vault", label: "Vault" },
  { id: "wellness", label: "Wellness" },
];

/**
 * The caregiver's cockpit for one patient: a segmented control across the
 * patient's reminders, routine, and vault (all editable) plus their wellness
 * (read-only). Reuses the same views the patient sees.
 */
export function PatientManager({
  caregiverId,
  patientId,
  patientName,
}: {
  caregiverId: string;
  patientId: string;
  patientName: string;
}) {
  const [section, setSection] = useState<Section>("reminders");
  const name = firstName(patientName);

  return (
    <div>
      <Link
        href="/caregiver"
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        All people
      </Link>

      <h1 className="mb-4 text-3xl font-bold tracking-tight text-label">
        {patientName || "Patient"}
      </h1>

      <div
        role="tablist"
        aria-label={`${name}'s sections`}
        className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-elev-1 p-1.5"
      >
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={section === item.id}
            onClick={() => setSection(item.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-xl px-4 text-base font-semibold transition-colors",
              section === item.id
                ? "bg-white text-black"
                : "text-label-2 hover:bg-elev-2",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "reminders" && (
        <RemindersView
          userId={patientId}
          actorId={caregiverId}
          canManage
          heading={`${name}'s reminders`}
          description={`For the things ${name} needs to do each day.`}
        />
      )}
      {section === "routine" && (
        <RoutineView
          userId={patientId}
          canManage
          description={`For the things ${name} does every day.`}
        />
      )}
      {section === "vault" && (
        <VaultView
          userId={patientId}
          canManage
          description={`For the things ${name} wants to remember.`}
        />
      )}
      {section === "wellness" && (
        <WellnessView
          userId={patientId}
          readOnly
          heading={`${name}'s wellness`}
          description={`For how ${name} has been feeling.`}
        />
      )}
    </div>
  );
}
