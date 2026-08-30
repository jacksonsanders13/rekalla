import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Camera, CalendarDays, Bell, Check } from "lucide-react";
import { RekallaAvatar } from "@/components/ui/rekalla-avatar";

export const metadata: Metadata = {
  title: { absolute: "Rekalla · Bring your paper life online" },
  description:
    "Take a photo of a paper calendar, an appointment card, or a bill. Rekalla reads the dates and reminds you when the day comes.",
};

const STEPS = [
  {
    badge: "camera" as const,
    Icon: Camera,
    title: "Take the photo",
    body: "A calendar on the kitchen wall, a card from the doctor, a bill with a due date. However it happens to be written.",
  },
  {
    badge: "calendar" as const,
    Icon: CalendarDays,
    title: "He reads the dates",
    body: "You see everything he found before anything is saved, and you can change whatever he got wrong.",
  },
  {
    badge: "bell" as const,
    Icon: Bell,
    title: "Then he reminds you",
    body: "It goes on your calendar, and your phone tells you when the day comes around.",
  },
];

const PROMISES = [
  "Nothing to type. You take the picture, Rekalla does the writing.",
  "Big, plain screens with no clutter and no jargon.",
  "Your calendar is yours alone. Nobody else can see it.",
];

const PAPERS = [
  "Paper wall calendars",
  "Appointment cards",
  "Bills with a due date",
  "Letters from the surgery",
  "School and church newsletters",
  "Anything with a date written on it",
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="" width={38} height={38} priority />
          <span className="text-xl font-bold tracking-tight text-label">Rekalla</span>
        </div>
        <Link
          href="/login"
          className="min-h-11 rounded-full px-5 py-2.5 text-lg font-semibold text-label-2 transition-colors hover:bg-white/10 hover:text-label"
        >
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-8 sm:pt-16">
        <div className="flex flex-col items-center gap-8 text-center">
          <RekallaAvatar size={132} />
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight text-label sm:text-6xl">
            Bring your paper life online
          </h1>
          <p className="max-w-xl text-balance text-xl leading-relaxed text-label-2 sm:text-2xl">
            Take a photo of a paper calendar, an appointment card, or a bill.
            Rekalla reads the dates and reminds you when the day comes.
          </p>
          <div className="flex w-full max-w-sm flex-col gap-3 pt-2 sm:max-w-none sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="flex min-h-14 items-center justify-center rounded-full bg-accent px-9 text-xl font-bold text-white transition-colors hover:bg-accent-2"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="flex min-h-14 items-center justify-center rounded-full bg-elev-1 px-9 text-xl font-semibold text-label transition-colors hover:bg-elev-2"
            >
              I already have an account
            </Link>
          </div>
          <p className="text-base text-label-3">Free to start. No card needed.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-label sm:text-4xl">
          Three steps, and you are done
        </h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ badge, Icon, title, body }) => (
            <li
              key={title}
              className="flex flex-col items-center gap-4 rounded-3xl bg-elev-1 p-7 text-center"
            >
              <RekallaAvatar size={96} badge={badge} />
              <h3 className="flex items-center gap-2 text-xl font-bold text-label">
                <Icon className="size-5 text-accent" aria-hidden="true" />
                {title}
              </h3>
              <p className="text-lg leading-relaxed text-label-2">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* What it reads */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16">
        <div className="grid gap-10 rounded-3xl bg-elev-1 p-8 sm:grid-cols-2 sm:p-12">
          <div className="flex flex-col justify-center gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-label sm:text-4xl">
              If it has a date on it, he can read it
            </h2>
            <p className="text-lg leading-relaxed text-label-2">
              Rekalla was built for the things that pile up on a kitchen table.
              He is not a medical tool and will not read prescriptions.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {PAPERS.map((paper) => (
              <li key={paper} className="flex items-start gap-3 text-lg text-label">
                <Check className="mt-1 size-5 shrink-0 text-accent" aria-hidden="true" />
                {paper}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Promises */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16">
        <ul className="grid gap-6 sm:grid-cols-3">
          {PROMISES.map((promise) => (
            <li
              key={promise}
              className="text-lg leading-relaxed text-label-2 sm:border-l sm:border-white/15 sm:pl-6"
            >
              {promise}
            </li>
          ))}
        </ul>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-accent px-6 py-14 text-center">
          <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Put the first thing on your calendar tonight
          </h2>
          <p className="max-w-lg text-balance text-lg text-white/85">
            Find a piece of paper with a date on it and take one photo. That is the
            whole of it.
          </p>
          <Link
            href="/signup"
            className="flex min-h-14 items-center justify-center rounded-full bg-white px-9 text-xl font-bold text-black transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl px-5 pb-16 pt-6">
        <div className="flex flex-col gap-5 border-t border-white/10 pt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="https://rekalla.app/privacy"
              className="min-h-11 py-2 text-base text-label-3 hover:text-label-2"
            >
              Privacy
            </a>
            <a
              href="https://rekalla.app/terms"
              className="min-h-11 py-2 text-base text-label-3 hover:text-label-2"
            >
              Terms
            </a>
            <Link
              href="/login"
              className="min-h-11 py-2 text-base text-label-3 hover:text-label-2"
            >
              Log in
            </Link>
          </div>
          <p className="mx-auto max-w-md text-base leading-relaxed text-label-4">
            Rekalla is not a medical device and does not provide medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
