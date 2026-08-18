"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompleteOnboarding } from "@/hooks/use-assistant-v2";
import { renderSection } from "@/components/profile/section-fields";
import { emptyProfile, SECTION_ORDER, type PersonalizationProfile, type SectionKey } from "@/lib/v2-types";

// A short, friendly line under each section title.
const SUBTITLE: Record<SectionKey, { title: string; subtitle: string }> = {
  identity: { title: "About you", subtitle: "A little about who you are." },
  people: { title: "The people in your life", subtitle: "Family, friends, and pets." },
  routine: { title: "Your week", subtitle: "What your days usually look like." },
  interests: { title: "Things you enjoy", subtitle: "The things you love." },
  preferences: { title: "How we talk", subtitle: "How you'd like Rekalla to chat with you." },
  practical: { title: "Handy details", subtitle: "A few things worth keeping close." },
};

// The survey is the intro screen followed by one screen per section.
const STEP_COUNT = SECTION_ORDER.length + 1;

export function WelcomeSurvey({
  userId,
  name,
  initialProfile,
}: {
  userId: string;
  name?: string;
  initialProfile?: Partial<PersonalizationProfile> | null;
}) {
  const router = useRouter();
  const complete = useCompleteOnboarding(userId);
  const [step, setStep] = useState(0); // 0 = intro
  // Seed from any existing profile so re-taking the survey never wipes data.
  const [profile, setProfile] = useState<PersonalizationProfile>(() => ({
    ...emptyProfile(userId),
    ...(initialProfile ?? {}),
  }));

  function finish() {
    complete.mutate(profile, {
      onSuccess: () => {
        router.push("/assistant");
        router.refresh();
      },
    });
  }

  const isIntro = step === 0;
  const sectionKey = SECTION_ORDER[step - 1];
  const setSection = (value: unknown) =>
    setProfile((p) => ({ ...p, [sectionKey]: value }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-base text-label-3">
          <span>{isIntro ? "Welcome" : `Step ${step} of ${STEP_COUNT - 1}`}</span>
          {!isIntro && (
            <button
              type="button"
              onClick={finish}
              className="font-semibold text-label-2 underline-offset-4 hover:underline"
            >
              Skip for now
            </button>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-elev-2">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${(step / (STEP_COUNT - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        {isIntro ? (
          <Intro name={name} />
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-label">{SUBTITLE[sectionKey].title}</h1>
              <p className="text-xl leading-relaxed text-label-2">{SUBTITLE[sectionKey].subtitle}</p>
            </div>
            <div className="space-y-5">
              {renderSection(sectionKey, profile[sectionKey], setSection)}
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-10 space-y-4">
        {isIntro ? (
          <Button size="lg" className="w-full text-xl" onClick={() => setStep(1)}>
            Let's begin
            <ArrowRight className="size-6" aria-hidden="true" />
          </Button>
        ) : step < STEP_COUNT - 1 ? (
          <Button size="lg" className="w-full text-xl" onClick={() => setStep((s) => s + 1)}>
            Continue
            <ArrowRight className="size-6" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full text-xl"
            onClick={finish}
            loading={complete.isPending}
          >
            <Check className="size-6" aria-hidden="true" />
            All done
          </Button>
        )}

        {!isIntro && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="flex w-full items-center justify-center gap-2 py-2 text-lg font-semibold text-label-3 hover:text-label-2"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back
          </button>
        )}

        <p className="flex items-center justify-center gap-2 pt-1 text-center text-sm text-label-3">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Your answers stay private. We never sell or share them.
        </p>
      </div>
    </div>
  );
}

function Intro({ name }: { name?: string }) {
  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold leading-tight text-label">
          {name ? `Welcome, ${name}.` : "Welcome."}
        </h1>
        <p className="text-xl leading-relaxed text-label-2">
          Let's set up Rekalla so it knows you. Answer a few simple questions and
          it can help with your day, remember the people you love, and be there
          when you need it.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl bg-elev-1 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-6 shrink-0 text-tint-green" aria-hidden="true" />
          <div>
            <p className="text-lg font-bold text-label">Your information is private</p>
            <p className="text-base leading-relaxed text-label-2">
              What you share stays in your account, just for you. We never sell it,
              share it, or use it for anything else.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 size-6 shrink-0 text-tint-green" aria-hidden="true" />
          <div>
            <p className="text-lg font-bold text-label">There are no wrong answers</p>
            <p className="text-base leading-relaxed text-label-2">
              Skip anything you'd rather not answer. You can always add more later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
