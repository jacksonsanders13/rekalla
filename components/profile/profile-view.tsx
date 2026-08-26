"use client";

import Link from "next/link";
import { Circle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { useProfileV2 } from "@/hooks/use-assistant-v2";
import {
  SECTION_ORDER,
  SECTION_LABELS,
  sectionState,
  overallProgress,
  type SectionState,
} from "@/lib/v2-types";

const META: Record<SectionState, { label: string; Icon: typeof Circle; cls: string }> = {
  empty: { label: "Not started", Icon: Circle, cls: "text-label-3" },
  partial: { label: "In progress", Icon: Clock, cls: "text-tint-orange" },
  complete: { label: "Done", Icon: CheckCircle2, cls: "text-tint-green" },
};

export function ProfileView({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useProfileV2(userId);
  const progress = profile ? overallProgress(profile) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-label">Your profile</h1>
      <p className="text-xl leading-relaxed text-label">
        The more Rekalla knows about you, the more it can help. Add a little at a
        time and come back whenever you like.
      </p>

      <div
        className="flex flex-col items-center gap-3 rounded-2xl bg-elev-1 p-6"
        aria-label={`Profile ${progress} percent complete`}
      >
        <span className="text-5xl font-semibold text-label">{progress}%</span>
        <div
          className="h-4 w-full overflow-hidden rounded-full bg-elev-3"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-tint-green" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-lg text-label-2">complete</span>
      </div>

      {isLoading || !profile ? (
        <p className="text-xl text-label-3">Loading your profile…</p>
      ) : (
        <ul className="space-y-3">
          {SECTION_ORDER.map((key) => {
            const st = sectionState(profile, key);
            const m = META[st];
            return (
              <li key={key}>
                <Link
                  href={`/profile/${key}`}
                  className="flex min-h-[72px] items-center justify-between gap-3 rounded-2xl bg-elev-1 p-4 hover:bg-elev-2 focus:outline-none focus:ring-[3px] focus:ring-white/25"
                >
                  <span className="space-y-1">
                    <span className="block text-xl font-bold text-label">
                      {SECTION_LABELS[key]}
                    </span>
                    <span className={`flex items-center gap-2 text-lg font-semibold ${m.cls}`}>
                      <m.Icon className="size-5" aria-hidden="true" />
                      {m.label}
                    </span>
                  </span>
                  <ChevronRight className="size-7 text-label-3" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
